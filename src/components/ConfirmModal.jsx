import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md">
        <h2 className="text-lg font-bold mb-4">Confirm Vote</h2>
        <p>{title}</p>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-green-500 text-white rounded">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
