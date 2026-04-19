export default function ConfirmModal({ isOpen, title, message, confirmText = '확인', cancelText = '취소', confirmColor = 'blue', onConfirm, onCancel }) {
  if (!isOpen) return null;

  const colorMap = {
    red:    'bg-red-500 hover:bg-red-600',
    blue:   'bg-blue-500 hover:bg-blue-600',
    amber:  'bg-amber-500 hover:bg-amber-600',
  };
  const btnColor = colorMap[confirmColor] ?? colorMap.blue;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
        {title && (
          <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
        )}
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line leading-relaxed">{message}</p>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${btnColor}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
