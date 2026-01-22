'use client'
import React, { useState , useEffect } from "react";
import { Spin , notification } from "antd";
import FacebookIcon from '@/assets/images/facebook.png'
import { axiosPost } from "@/lib/axios";
import { setCookies1Year } from "@/lib/cookie";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { checkBeforeLogin } from "@/lib/checkBeforeLogin";


import dynamic from 'next/dynamic';
const LoginSocialFacebook = dynamic(() => import('reactjs-social-login').then(mod => mod.LoginSocialFacebook), { ssr: false });

const LoginFacebook = () => {

    const router = useRouter()
    const APP_ID_FACEBOOK = process.env.NEXT_PUBLIC_FACEBOOK_ID;
    const [Spinloading, setSpinLoading] = useState(false);

    

    const responseFacebook = async (email , name) => {
        setSpinLoading(true);
        
        try {
            if (name && email) {
                const body = {
                    email : email , 
                    name : name , 
                }

                const response = await axiosPost( 'user/sociallogin', body );
                const data = response.data
                if (data.token) {
                    setCookies1Year('token', data.token ); 
                    setCookies1Year('closePopupPolicy','') 
                    const navi = checkBeforeLogin(data.token)
                    if (navi) {
                        // router.push('/sprofile')
                        window.location.href = '/sprofile'
                    }else{
                        // router.refresh()
                        window.location.reload();
                    }
                } 
                 
            }else{
                notification.warning({
                    message: <i>ข้อมูลไม่ครบหรือไม่มี Email โปรดลองใหม่</i>,
                    duration: 2,
                }); 
            }
            
          } catch (error) {
              console.error(error);
          }
        
    }



    return (
            <Spin spinning={Spinloading}>
                <LoginSocialFacebook
                    appId={APP_ID_FACEBOOK} 
                    onResolve={({ provider, data }) => {
                        responseFacebook(data.email , data.name);
                    }}
                    onReject={(err) => {
                    console.log(err)
                    }} 
                >
                    <div className='border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50'>
                        <Image className="inline-block h-[23px] w-[23px] rounded-full " src={FacebookIcon} alt="" /> 
                    </div>
                </LoginSocialFacebook>
            </Spin>
        );
    }
  
  export default LoginFacebook;