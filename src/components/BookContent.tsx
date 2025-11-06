interface BookContentProps {
  content: string;
}

const BookContent = ({ content }: BookContentProps) => (
  <div className="mt-4">
    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
      {content}
    </p>
  </div>
);
export default BookContent;
