import {ReactNode, useEffect, useState} from "react";
import Axios from "../Services/Axios";
import { useNavigate } from "react-router-dom";
import { useCustom } from "../Store/Store";
import { isTokenExpired } from "../Services/Services";
import { connectSocket } from "../Services/socket.client";


const BASE=import.meta.env.VITE_API_URL||"http://localhost:8000/api";
let refreshPromise:Promise<string|null>|null=null;

const refreshAccessToken=async():Promise<string|null>=>{
  if(refreshPromise)return refreshPromise;

  refreshPromise=Axios.post(`${BASE}/api/auth/refresh`,{},{
    withCredentials:true
  }).then(res=>res.data?.accessToken ?? null).catch(()=>null)
.finally(()=>{refreshPromise=null});
  return refreshPromise;
};

export const ProtectedRoute=({children}:{children:ReactNode})=>{
  const {token,setToken}=useCustom() as {
    token:string|null
    setToken:(t:string|null)=>void
  };
  const navigate=useNavigate();
  const [checking,setChecking]=useState(!token);
  useEffect(()=>{
    if(token && !isTokenExpired(token)){
      setChecking(false);
      return;
    };
    refreshAccessToken().then(newToken=>{
      if(newToken){
        setToken(newToken);
        connectSocket(newToken as string);
        setChecking(false);
      }else{
        navigate("/login",{replace:true});
      }
    });
  },[]);
  if(checking)return null;
  return <>{children}</>;
};