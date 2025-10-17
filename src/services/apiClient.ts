import axios from "axios";

//สร้าง  BaseUrl ไว้ส่วนกลางจะได้ไม่ต้องเขียนใหม่
const apiClient = axios.create({
    baseURL : "http://192.168.220.210:3342/api",
    headers : {
        "Content-Type" : "application/json",
    },
});

export default apiClient;