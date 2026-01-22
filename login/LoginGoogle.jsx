'use client'
import React, { useState ,useCallback } from "react";
import { GoogleOAuthProvider , GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { Spin} from "antd";
import { checkBeforeLogin } from "@/lib/checkBeforeLogin";
import { setCookies1Year } from "@/lib/cookie";
import { axiosPost } from "@/lib/axios";
import { useRouter } from "next/navigation";




const LoginGoogle = () => {

    const router = useRouter()
    const ID_Client = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const [Spinloading, setSpinLoading] = useState(false);


    const handleGoogleResponse = async (email , name) => {

        setSpinLoading(true);
        
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
                        window.location.href = '/sprofile'
                    }else{
                        // router.refresh()
                        window.location.reload();
                    }
                } 
                 
            } 
            
          } catch (error) {
              console.error(error);
          }

    }



    return (
        <a className=' overflow-hidden'>
            <Spin spinning={Spinloading}>
                <GoogleOAuthProvider clientId={ID_Client} >
                <GoogleLogin 
                    onSuccess={response => {
                        // 
                        const decoded = jwtDecode(response.credential);
                        const email = decoded.email;
                        const name = decoded.name;
                        handleGoogleResponse(email,name); 
                    }}
                    onError={() => {
                        console.log('Login Failed');
                    }}
                    style={{ border: 'none' }}
                    />
                </GoogleOAuthProvider>
            </Spin>
        </a>
    );
  }
  
  export default LoginGoogle;