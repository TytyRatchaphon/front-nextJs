import { describe, it, expect } from "vitest";
import { normalizeBook, normalizeBooks } from "./normalizeBook";

describe("normalizeBook", () => {
  it("normalizes a BookTrans-shaped object (shelve_count)", () => {
    const raw = {
      book_id: 123,
      bookID: "ABC",
      img: "/img/book.jpg",
      name: "Test Book",
      title: "A description",
      view: 5000,
      chapter: 42,
      shelve_count: 300,
      tag: ["fantasy", "action"],
      "category1.name": "นิยาย",
      "category2.name": "แฟนตาซี",
      status: "publish",
      end: "not_end",
      writer: {
        user_id: 10,
        writer_name: "AuthorName",
        img: "/img/author.jpg",
        isFollowing: true,
      },
      star: 4.5,
    };

    const book = normalizeBook(raw);
    expect(book.book_id).toBe(123);
    expect(book.bookID).toBe("ABC");
    expect(book.name).toBe("Test Book");
    expect(book.view).toBe(5000);
    expect(book.chapter).toBe(42);
    expect(book.shelve_count).toBe(300);
    expect(book.tag).toBe("fantasy,action");
    expect(book.category).toBe("นิยาย");
    expect(book.category2).toBe("แฟนตาซี");
    expect(book.writer?.writer_name).toBe("AuthorName");
    expect(book.writer?.isFollowing).toBe(true);
    expect(book.star).toBe(4.5);
  });

  it("normalizes a BookDetail-shaped object (shelveCount)", () => {
    const raw = {
      book_id: 456,
      img: "/img/detail.jpg",
      name: "Detail Book",
      des: "Some description",
      view: 1234,
      chapter: 10,
      shelveCount: 88,
      "writer.writer_name": "WriterFromDot",
      status: "publish",
      end: "end",
      star: 3,
    };

    const book = normalizeBook(raw);
    expect(book.book_id).toBe(456);
    expect(book.shelve_count).toBe(88);
    expect(book.author).toBe("WriterFromDot");
    expect(book.description).toBe("Some description");
  });

  it("normalizes a UniversalBook-shaped object (shelf_count, shelfCount)", () => {
    const raw = { book_id: 789, name: "Universal", shelf_count: 55 };
    expect(normalizeBook(raw).shelve_count).toBe(55);

    const raw2 = { book_id: 790, name: "Universal2", shelfCount: 66 };
    expect(normalizeBook(raw2).shelve_count).toBe(66);
  });

  it("resolves book_id from bookID or id as fallback", () => {
    expect(normalizeBook({ bookID: "B1" }).book_id).toBe("B1");
    expect(normalizeBook({ id: 99 }).book_id).toBe(99);
    expect(normalizeBook({}).book_id).toBe(0);
  });

  it("resolves author from multiple possible field names", () => {
    expect(normalizeBook({ writer_name: "A" }).author).toBe("A");
    expect(normalizeBook({ author: "B" }).author).toBe("B");
    expect(normalizeBook({ user_name: "C" }).author).toBe("C");
    expect(normalizeBook({}).author).toBe("");
  });

  it("handles tag as string, array, or missing", () => {
    expect(normalizeBook({ tag: "a,b" }).tag).toBe("a,b");
    expect(normalizeBook({ tag: ["a", "b"] }).tag).toBe("a,b");
    expect(normalizeBook({}).tag).toBe("");
  });

  it("coerces view and chapter to numbers", () => {
    const book = normalizeBook({ view: "999", chapter: "5" });
    expect(book.view).toBe(999);
    expect(book.chapter).toBe(5);
  });

  it("normalizeBooks maps an array", () => {
    const list = [
      { book_id: 1, name: "Book 1" },
      { book_id: 2, name: "Book 2" },
    ];
    const result = normalizeBooks(list);
    expect(result).toHaveLength(2);
    expect(result[0].book_id).toBe(1);
    expect(result[1].name).toBe("Book 2");
  });
});
