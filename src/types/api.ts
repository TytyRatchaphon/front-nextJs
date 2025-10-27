export enum BookCompletion {
  NOT_END = 'not_end',
  END = 'end',
}

export enum BookStatus {
  PUBLISH = 'publish',
  PRIVATE = 'private',
  DELETE = 'delete',
  WAIT = 'wait',
}

export enum BookType {
  WRITE = 'write',
  TRAN = 'tran',
  SOUND = 'sound',
  FANFIC = 'fanfic',
  CHAT = 'chat',
  WEBTOON = 'webtoon',
  FILM = 'film',
}

export interface BookTrans {
  book_id: number; // int(10), AUTO_INCREMENT
  bookID: string; // varchar(100)
  type: BookType; // enum(...)
  img: string; // varchar(255)
  name: string; // varchar(255)
  title: string; // text
  tag: string; // text
  cat1: number; // tinyint(4)
  cat2: number; // tinyint(4)
  rate: number; // tinyint(4)
  des: string | null; // text, Nullable
  user_id: number; // int(11)
  status: BookStatus; // enum(...)
  view: number; // int(11)
  dateAt: Date | string | null; // datetime, Nullable (จาก 'date_at')
  updateAt: Date | string | null; // datetime, Nullable (จาก 'update_at')
  heart: number; // int(11)
  flower: number; // int(11)
  end: BookCompletion; // enum(...)
  bgimg: string | null; // varchar(255), Nullable
  notiAdd: 'yes' | 'no'; // enum('yes','no') (จาก 'noti_add')
  acceptConditions: string | null; // varchar(20), Nullable (จาก 'accept_conditions')
  userFreecoin: number | null; // tinyint(4), Nullable (จาก 'user_freecoin')
  fastStatus: number; // tinyint(4) (จาก 'fast_status')
  createdAt: Date | string; // datetime
  updatedAt: Date | string; // datetime
}
