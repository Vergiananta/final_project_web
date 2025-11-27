import { useState } from 'react';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000';

function App() {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [downloadName, setDownloadName] = useState('');
  const [plotUrl, setPlotUrl] = useState('');

  const toDDMMYYYY = (yyyyMmDd) => {
    if (!yyyyMmDd) return '';
    const [y, m, d] = yyyyMmDd.split('-');
    return `${d}/${m}/${y}`;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setDownloadUrl('');
    setPlotUrl('');
    if (!file || !startDate || !endDate) {
      setError('File CSV, tanggal mulai, dan tanggal selesai wajib diisi');
      return;
    }
    const s = toDDMMYYYY(startDate);
    const eDate = toDDMMYYYY(endDate);
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (sd > ed) {
      setError('Tanggal mulai harus sebelum atau sama dengan tanggal selesai');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('start_date', s);
      formData.append('end_date', eDate);
      const res = await fetch(`${API_BASE}/predict`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Gagal memproses data');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = `prediksi_${s.replaceAll('/', '-')}_to_${eDate.replaceAll('/', '-')}.xlsx`;
      setDownloadUrl(url);
      setDownloadName(name);
      const pUrl = `${API_BASE}/plot?start_date=${encodeURIComponent(s)}&end_date=${encodeURIComponent(eDate)}&_=${Date.now()}`;
      setPlotUrl(pUrl);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="header">
        <div className="title">Tide Forecast</div>
        <div className="subtitle">Prediksi pasang-surut berdasarkan data CSV</div>
      </div>
      <div className="container">
        <form className="card" onSubmit={onSubmit}>
          <div className="field">
            <label>File CSV</label>
            <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0] || null)} />
          </div>
          <div className="grid">
            <div className="field">
              <label>Tanggal Mulai</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="field">
              <label>Tanggal Selesai</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Memproses...' : 'Proses Prediksi'}
          </button>
        </form>

        {(downloadUrl || plotUrl) && (
          <div className="results">
            {downloadUrl && (
              <a className="button secondary" href={downloadUrl} download={downloadName}>
                Unduh Excel Hasil Prediksi
              </a>
            )}
            {plotUrl && (
              <div className="imageWrap">
                <img src={plotUrl} alt="Plot Prediksi" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
