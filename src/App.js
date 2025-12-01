import { useState } from "react";
import "./App.css";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

function App() {
  const [file, setFile] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");
  const [plotUrl, setPlotUrl] = useState("");

  const toDDMMYYYY = (yyyyMmDd) => {
    if (!yyyyMmDd) return "";
    const [y, m, d] = yyyyMmDd.split("-");
    return `${d}/${m}/${y}`;
  };

  const getExcel = async (formData, s, eDate) => {
    const res = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Gagal memproses data");
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const name = `prediksi_${s.replaceAll("/", "-")}_to_${eDate.replaceAll("/", "-")}.xlsx`;
    setDownloadUrl(url);
    setDownloadName(name);
  };

  const getPlot = async (formData) => {
    const resPlot = await fetch(`${API_BASE}/plot`, {
        method: "POST",
        body: formData,
      });
      if (!resPlot.ok) {
        const text = await resPlot.text();
        throw new Error(text || "Gagal membuat plot");
      }
      const plotBlob = await resPlot.blob();
      const plotObjectUrl = URL.createObjectURL(plotBlob);
      setPlotUrl(plotObjectUrl);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setDownloadUrl("");
    setPlotUrl("");
    if (!file || !startDate || !endDate) {
      setError("File CSV, tanggal mulai, dan tanggal selesai wajib diisi");
      return;
    }
    const s = toDDMMYYYY(startDate);
    const eDate = toDDMMYYYY(endDate);
    const sd = new Date(startDate);
    const ed = new Date(endDate);
    if (sd > ed) {
      setError("Tanggal mulai harus sebelum atau sama dengan tanggal selesai");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append('start_date', s);
      formData.append('end_date', eDate);
      await Promise.all([getExcel(formData, s, eDate), getPlot(formData)]);
    } catch (err) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="header">
        <div className="title">Tide Forecast</div>
        <div className="subtitle">
          Prediksi pasang-surut berdasarkan data CSV
        </div>
      </div>
      <div className="container py-3">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card shadow border-0">
              <div className="card-body p-4">
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-white">File CSV</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setFile(e.target.files[0] || null)}
                      className="form-control"
                    />
                  </div>
                  <div className="row g-3">
                    <div className="col-sm-6">
                      <label className="form-label text-white">
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="form-control"
                      />
                    </div>
                    <div className="col-sm-6">
                      <label className="form-label text-white">
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="form-control cursor-pointer"
                      />
                    </div>
                  </div>
                  {error && (
                    <div className="alert alert-danger mt-3">{error}</div>
                  )}
                  <button
                    className="btn btn-primary mt-3"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Memproses..." : "Proses Prediksi"}
                  </button>
                </form>

                {(downloadUrl || plotUrl) && (
                  <div className="mt-4">
                    {downloadUrl && (
                      <a
                        className="btn btn-outline-secondary me-2"
                        href={downloadUrl}
                        download={downloadName}
                      >
                        Unduh Excel Hasil Prediksi
                      </a>
                    )}
                    {plotUrl && (
                      <div className="mt-3">
                        <img
                          src={plotUrl}
                          alt="Plot Prediksi"
                          className="img-fluid rounded"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
