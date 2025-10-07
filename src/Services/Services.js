import Axios from "./Axios";
import {jwtDecode} from "jwt-decode";

export const GetService=async(route,token)=>{
    const result = await Axios.get(route,{
        headers:{
            Authorization:`Bearer ${token}`,
        },
        withCredentials:true
    });    
    if(result.status==200){
        return result.data;
    };
};
export const PostService=async(route,data,token)=>{
    try {
        const result = await Axios.post(route,data,{
            headers:{
                'Authorization':`Bearer ${token}`
            },
            withCredentials:true
        });
        console.log(result);
    } catch (error) {
        console.log(`post server error ${error}`);
    }
};
export const PatchService=async(route,data,token)=>{
    try {
        const result = await Axios.patch(route,data,{
            headers:{
                Authorization:`Bearer ${token}`
            },
            withCredentials:true,
        });
        if(result.status==200){
            console.log(result);
        };
    } catch (error) {
        console.log(`patch error ${error}`);
    }
};
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