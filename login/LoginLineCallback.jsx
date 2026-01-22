
'use client'
import React, { useEffect} from "react";
import liff  from '@line/liff';
import { jwtDecode } from "jwt-decode";
import { notification } from "antd";
import Loading from "../addon/Loading";
import { useRouter } from "next/navigation";
import { axiosPost } from "@/lib/axios";
import { setCookies1Year } from "@/lib/cookie";
import { checkBeforeLogin } from "@/lib/checkBeforeLogin";
import { useAuth } from "@/contexts/AuthContext";

export default function LineCallback() {


    const LINE_ID = process.env.NEXT_PUBLIC_LINE_ID;
    const router = useRouter()
    const { checkToken } = useAuth()

    useEffect(()=>{
        liff.init({ liffId: LINE_ID })
        .then(() => {
            Onlogin();
        })
        .catch((error) => {
        })

    },[ LINE_ID ])



const Onlogin = async () => {
    
    try{
        const idtoken =  liff.getIDToken(); 

        const decoded =  jwtDecode(idtoken);
        
        if(decoded){
            const { name , email} = decoded;
            if(name && email){
                responseLine(email ,name);
            }else{
                await liff.init({ liffId: VITE_LINE_ID });
                liff.logout();
                notification.warning({
                    message: <i>ข้อมูลไม่ครบหรือไม่มี Email โปรดลองใหม่</i>,
                    duration: 2,
                  }); 
                router.push('/')
            }
        }
        
        
    }catch(err){
        console.log(err);
    }
}



const responseLine = async (email ,name) => {
    // ทำสิ่งที่คุณต้องการกับข้อมูลที่ได้รับจากการล๊อกอินด้วย Line

    try {
        if (name && email) {
            const body = {
                email : email , 
                name : name , 
            }
            const response = await axiosPost('user/sociallogin', body)

            const data = response.data

            if (data.token) {
                setCookies1Year('token', data.token );
                setCookies1Year('closePopupPolicy','') 
                const navi = checkBeforeLogin(data.token)
                if (navi) {
                    router.push('/sprofile')
                }else{
                    checkToken()
                    router.push('/') 
                }
            } 
             
        }else{
            notification.warning({
                message: <i>ข้อมูลไม่ครบหรือไม่มี Email โปรดลองใหม่</i>,
                duration: 2,
            }); 
            router.push('/')
        }
        
    } catch (error) {
        console.error(error);
    //   return [];
    }

 
  };
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' , zIndex: 1000 }} className='bg-white' >
            <Loading />
        </div>
    );

}


