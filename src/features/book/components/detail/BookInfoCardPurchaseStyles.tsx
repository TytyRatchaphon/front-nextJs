const BookInfoCardPurchaseStyles = () => (
  <style>{`
    .book-select-modal .ant-checkbox-inner { border-color: #e11d48; transition: border-color .12s, background-color .12s; }
    .book-select-modal .ant-checkbox-wrapper:hover .ant-checkbox-inner,
    .book-select-modal .ant-checkbox:hover .ant-checkbox-inner {
      border-color: #e11d48 !important;
    }
    .book-select-modal .ant-checkbox-input:focus + .ant-checkbox-inner {
      border-color: #e11d48 !important;
      box-shadow: none !important;
    }
    .book-select-modal .ant-checkbox-checked .ant-checkbox-inner {
      background-color: #e11d48 !important;
      border-color: #e11d48 !important;
    }
    .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled) {
      background-color: #e11d48 !important;
      border-color: #e11d48 !important;
      color: white !important;
    }
    .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled):hover {
      background-color: #be123c !important;
      border-color: #be123c !important;
      color: white !important;
    }
    .ant-radio-button-wrapper:hover {
      color: #e11d48 !important;
      border-color: #e11d48 !important;
    }
    .ant-radio-button-wrapper:focus-within {
      box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.12) !important;
    }
    .ant-radio-button-wrapper-checked:not(.ant-radio-button-wrapper-disabled)::before {
      background-color: #e11d48 !important;
    }
    @media (max-width: 768px) {
      .book-select-modal .ant-modal {
        max-width: calc(100vw - 16px) !important;
        margin: 8px auto !important;
      }
      .book-select-modal .ant-modal-content {
        padding-inline: 10px;
      }
    }
  `}</style>
);

export default BookInfoCardPurchaseStyles;
