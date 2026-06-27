// src/components/Modal.jsx

function Modal({ isOpen, title, kicker, icon, onClose, children }) {
  if (!isOpen) {
    return null;
  }
  const handleClose = onClose || (() => {});

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            {icon && <span className="modal-icon">{icon}</span>}
            <div>
              {kicker && <p className="modal-kicker">{kicker}</p>}
              <h2 className="modal-title">{title}</h2>
            </div>
          </div>
          <button className="modal-close" type="button" onClick={handleClose}>
            Close
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
