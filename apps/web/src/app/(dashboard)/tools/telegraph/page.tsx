/**
 * Telegraph Upload page - placeholder for image upload to Telegraph.ph.
 * Full implementation will be added in subsequent tasks.
 */
export default function TelegraphPage(): React.ReactElement {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-surface-50">Telegraph Upload</h1>
        <p className="mt-1 text-sm text-surface-400">Unggah gambar ke Telegraph.ph untuk mendapatkan tautan langsung</p>
      </div>

      <div className="glass-card p-6">
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-surface-700 p-8 transition-colors hover:border-brand-500/50">
          <div className="mb-4 text-6xl">📸</div>
          <h2 className="text-lg font-semibold text-surface-300">Seret gambar ke sini</h2>
          <p className="mt-1 text-sm text-surface-500">atau klik untuk memilih file</p>
          <p className="mt-3 text-xs text-surface-600">Maksimal 5MB · JPEG, PNG, GIF, WebP</p>
        </div>
      </div>
    </div>
  );
}
