
import apiClient from "../apiClient";

// --- Bank & ID Card ---

export const getBankList = async () => {
  try {
    const response = await apiClient.get('/writer/bank_list');
    return response.data?.data ?? [];
  } catch (error: any) {
    throw error;
  }
};

export const updateBankIdCardAccount = async (formData: FormData) => {
  try {
    const response = await apiClient.post('/writer/bank_idcard_account', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

export const getBankIdCardAccount = async () => {
  try {
    const response = await apiClient.get('/writer/bank_idcard_account');
    return response.data;
  } catch (error: any) {
    throw error;
  }
};

// --- Withdraw ---

export interface WriterWithdrawData {
  id: number;
  date_withdraw: string;
  status: string;
  get_amount: string;
  service: string;
  tax_amount: string;
  amount: string;
  acc_number: string;
  tax: any;
}

export const postWriterWithdraw = async (amount: number) => {
  return await apiClient.post('/writer/withdraw', { amount });
};

export const fetchWriterWithdrawHistory = async () => {
  const response = await apiClient.get('/writer/withdraw');
  return response.data?.data ?? [];
};

export const fetchWriterWithdrawSetting = async () => {
  const response = await apiClient.get('/writer/withdraw/setting');
  return response.data?.data ?? null;
};
