import Axios from "./Axios";
import {jwtDecode} from "jwt-decode";

export const GetService=async(route,token)=>{
    const result = await Axios.get(route,{
        headers:{
            Authorization:`Bearer ${token}`
        }
    });    
    console.log(result);
    if(result.status==200){
        return result.data;
    };
};
export const PostService=(route,data)=>{};
export const PatchService=(route,data)=>{};
export const DeleteService=(route)=>{};
export const isTokenExpired=(token)=>{
    if(!token)return true;
    const decoded = jwtDecode(token);
    return decoded.exp * 1000 < Date.now();
};
export const useRefreshToken=async()=>{
    const result = await Axios.post("/refresh-token");
    console.log(result);
};