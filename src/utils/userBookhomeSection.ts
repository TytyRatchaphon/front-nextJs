export const isUserBookhomeSection = (section: any) =>
  Boolean(section?.user_bookhome_section) && !section?.home_group_id;

export const getBookhomeSectionId = (section: any) =>
  section?.home_group_id ?? section?.user_bookhome_section ?? section?.id;
