'use client'
import React, { useState }  from "react";
import liff  from '@line/liff'; 
import LinePng from '../../assets/images/line.png'
import Image from "next/image";
import { Spin } from "antd";

export default function LineLoginWeb() {
    const LINE_ID = process.env.NEXT_PUBLIC_LINE_ID;

    const [spinLoading , setSpinLoading] = useState(false)

const Linelogin = async () => {
    setSpinLoading(true)
    try{
        await liff.init({ liffId: LINE_ID });
        await liff.login();
        // liff.login();
    }catch(err){
    }
}

    return (
        <>
            <Spin spinning={spinLoading}>
            <a className='border border-gray-200 rounded-md py-2 flex justify-center items-center cursor-pointer hover:bg-blue-50'  onClick={Linelogin}>
                <Image className="inline-block h-[23px] w-[23px] rounded-full " src={LinePng} alt="" />           
            </a>
            </Spin>
        </>
    );

}

