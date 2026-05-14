type WriterCheckLike = {
  status?: string | null;
  can_set_ep_price?: boolean | null;
  can_withdraw?: boolean | null;
  message?: string | null;
  reason?: string | null;
};

export const canSetEpisodePrice = (writerCheck: WriterCheckLike | null | undefined) => {
  return writerCheck?.can_set_ep_price === true || writerCheck?.status === 'approve';
};

export const getEpisodePriceRestrictionMessage = (writerCheck: WriterCheckLike | null | undefined) => {
  if (writerCheck?.status === 'reject') {
    const message = writerCheck.message || 'บัญชีนักเขียนไม่ผ่านการอนุมัติ กรุณาแก้ไขข้อมูลแล้วส่งตรวจใหม่';
    return `${message} จึงจะสามารถตั้งราคาตอนได้`;
  }

  if (writerCheck?.status === 'wait') {
    return 'บัญชีนักเขียนอยู่ระหว่างรอแอดมินอนุมัติ คุณสามารถสร้างหรือแก้ไขตอนฟรีได้ แต่ยังตั้งราคาตอนและถอนเงินไม่ได้จนกว่าข้อมูลจะได้รับการยืนยัน';
  }

  return 'ต้องยืนยันข้อมูลบัญชีนักเขียนก่อน จึงจะสามารถตั้งราคาตอนได้';
};

export const canWithdraw = (writerCheck: WriterCheckLike | null | undefined) => {
  return writerCheck?.can_withdraw === true || writerCheck?.status === 'approve';
};

export const getWithdrawRestrictionMessage = (writerCheck: WriterCheckLike | null | undefined) => {
  if (writerCheck?.status === 'reject') {
    const message = writerCheck.message || 'บัญชีนักเขียนไม่ผ่านการอนุมัติ กรุณาแก้ไขข้อมูลแล้วส่งตรวจใหม่';
    return `${message} จึงจะสามารถถอนเงินได้`;
  }

  if (writerCheck?.status === 'wait') {
    return 'ต้องได้รับการอนุมัติบัญชีนักเขียนจากแอดมินก่อน จึงจะสามารถถอนเงินได้';
  }

  return 'ต้องยืนยันข้อมูลบัญชีนักเขียนก่อน จึงจะสามารถถอนเงินได้';
};
