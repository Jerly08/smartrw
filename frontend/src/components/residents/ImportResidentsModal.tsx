import React from 'react';

interface ImportResidentsModalProps {
  onClose: () => void;
  onImportSuccess: () => void;
}

const ImportResidentsModal: React.FC<ImportResidentsModalProps> = ({ onClose, onImportSuccess }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">Impor Data Penduduk</h2>
        <p className="mb-4 text-gray-600">Fitur impor data penduduk belum tersedia.</p>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            onClick={onClose}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportResidentsModal;