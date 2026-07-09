import { isObject } from "chart.js/helpers";
import Axios from "./Axios";

export const GetService=async(route:string,token:string)=>{
    const result = await Axios.get(route,{
        headers:{
            Authorization:`Bearer ${token}`,
        },
        withCredentials:true
    });    
    if(result.status==200){
        return result.data;
    };
    if(result.status==204){
        return [];
    }
};
// Services/Services.ts (add this alongside your existing functions)

/**
 * Returns true if the token is missing, malformed, or expires within 60 seconds.
 * The 60-second buffer prevents edge cases where the token expires between
 * the check and the actual API call.
 */
export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token) return true

  try {
    // JWT is three base64url segments separated by dots
    const parts = token.split(".");
    if (parts.length !== 3) return true;

    // Decode the payload (middle segment)
    // atob doesn't handle base64url — replace url-safe chars first
    ;
    const base64 = parts[1]?.replace(/-/g, "+").replace(/_/g, "/")
    const payload = JSON.parse(atob(base64 as string))

    if (typeof payload.exp !== "number") return true

    // payload.exp is in seconds, Date.now() is in milliseconds
    const expiresInMs = payload.exp * 1000 - Date.now()

    // Treat as expired if less than 60 seconds remain
    return expiresInMs < 60 * 1000
  } catch {
    // Malformed token — treat as expired
    return true
  }
}