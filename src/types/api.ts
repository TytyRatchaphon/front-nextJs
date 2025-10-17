export type Novel = {
    ID: number;
    name    : string;
    author  : string;
    view   : number;
    chapter: number;
    novel_cover: string;
    novel_link: string;
    created_at: string;
    updated_at: string;
    deleated_at: string | null;

};

export type RecNovel = {
    ID : number
    rec_novel_cover : string
    rec_novel_link : string
    rec_novel_name : string
    rec_novel_author : string
    rec_novel_view : number
    rec_novel_chapter : number
    rec_novel_comment : number
    CreatedAt : string
    UpdatedAt : string
    DeletedAt : string | null
};

export type Banner = {
    ID : number
    banner_cover : string
    banner_link : string
    CreatedAt : string
    UpdatedAt : string
    DeletedAt : string | null

};

export type ExclusiveNovel = {
    ID : number
    exclusive_novel_cover : string
    exclusive_novel_link : string
    exclusive_novel_name : string
    exclusive_novel_author : string
    exclusive_novel_description :string
    exclusive_novel_view : number
    exclusive_novel_chapter : number
    exclusive_novel_comment : number
};

export type NodeBook = {
    id : number
    book_id : string
    type : string
    img : string
    by : string 
    title : string 
    intro : string
    description : string
    status : string
    end_state : string
    createdAt : string
    updatedAt : string
    category : number
    sub_category : number
    tag : string
    recommended : string
    view : number
}