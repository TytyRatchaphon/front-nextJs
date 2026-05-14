export interface ArticleDetail {
  id: number;
  articleID: string;
  name: string;
  title: string;
  description: string;
  keywords: string;
  detail_1: string;
  detail_2: string;
  img: string;
  type: string;
  date_post: string;
  update_at: string;
  view: number;
  shared: number;
  post_by: string;
  tag: string;
  status: string;
  button1_img?: string;
  button1_type?: string;
  button1_data?: string;
  button2_img?: string;
  button2_type?: string;
  button2_data?: string;
  button3_img?: string;
  button3_type?: string;
  button3_data?: string;
}

export interface ArticleRecommend {
  id: number;
  name: string;
  img: string;
  view: number;
  update_at: string;
}

export interface ArticleResponse {
  code: number;
  status: string;
  message: string;
  data: {
    result: ArticleDetail[];
    listRecommend: ArticleRecommend[];
  };
}

export interface ArticleItem {
  id: number;
  name: string;
  img: string;
  date_post: string;
  view: number;
}
