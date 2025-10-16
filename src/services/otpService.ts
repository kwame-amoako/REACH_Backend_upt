import axios from "axios";

const BASE_URL = process.env.BULKCLIX_API_URL || "";

export const sendOtp = async (phoneNumber: string) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/otp/send`,
      { phoneNumber },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BULKCLIX_API_KEY}`,
        },
      }
    );
    return response.data; // includes requestId
  } catch (error: any) {
    console.error(
      "BulkClix sendOtp error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to send OTP");
  }
};

export const verifyOtp = async (
  requestId: string,
  phoneNumber: string,
  code: string
) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/otp/verify`,
      { requestId, phoneNumber, code },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BULKCLIX_API_KEY}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    console.error(
      "BulkClix verifyOtp error:",
      error.response?.data || error.message
    );
    throw new Error("Failed to verify OTP");
  }
};
