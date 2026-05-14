export interface WebsiteSettingsData {
  percent: string;
  address: string;
  work_time: string;
  phone: string;
  email: string;
  app_store: string;
  play_store: string;
  fb_link: string;
  line_link: string;
  ig_link: string;
  tiktok_link: string;
  twitter_link: string;
  yt_link: string;
  logo: string;
  img_error: string;
  img_footer: string;
  coin: string;
  freecoin: string;
  seo_title: string;
  seo_keyword: string;
  seo_description: string;
  "7D_Checkin"?: string;
  [key: string]: string | undefined;
}

export interface WebsiteSettingsResponse {
  code: number;
  status: string;
  message: string;
  data: WebsiteSettingsData;
}
