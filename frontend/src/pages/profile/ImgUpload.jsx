import { useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faUpload, faTimes } from "@fortawesome/free-solid-svg-icons";

const ImgUpload = ({ src, isLoading, pendingFile, onFileSelect, onSave, onCancel, isSaving }) => {
  const inputRef = useRef(null);

  // pendingFile preview takes priority over saved src
  const previewSrc = pendingFile
    ? URL.createObjectURL(pendingFile)
    : (src && typeof src === 'string' && src.trim() ? src : null);

  // Only show spinner when loading initial image and no preview available
  const showSpinner = isLoading && !previewSrc;

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative w-32 h-32">
        <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {showSpinner ? (
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-400 border-t-transparent" />
          ) : previewSrc ? (
            <img src={previewSrc} alt="Profile" className="object-cover w-full h-full" />
          ) : (
            <FontAwesomeIcon icon={faCamera} className="text-gray-400 text-3xl" />
          )}
        </div>

        {/* Camera button — hidden while a file is pending or saving */}
        {!pendingFile && !isSaving && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="absolute bottom-0 right-0 w-9 h-9 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
            title="Change photo"
          >
            <FontAwesomeIcon icon={faCamera} className="text-sm" />
          </button>
        )}
      </div>

      {/* Save / Cancel — only shown when a file is pending */}
      {pendingFile && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm rounded-lg font-medium transition-colors"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FontAwesomeIcon icon={faUpload} />
            )}
            {isSaving ? "Saving…" : "Save Photo"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-200 hover:bg-gray-300 disabled:opacity-60 text-gray-700 text-sm rounded-lg font-medium transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
            Cancel
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) onFileSelect(file);
          e.target.value = "";
        }}
        className="hidden"
      />
    </div>
  );
};

export default ImgUpload;
