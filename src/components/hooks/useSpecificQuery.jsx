import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services";

const useSpecificQuery=(route,id,token,queryKey="student_id")=>{
    return useQuery({
        queryKey:[queryKey,id],
        queryFn:async()=>await GetService(route,token),
        enabled:!!id,
        staleTime:1000*60*60,
        cacheTime:1000*60*60
    });
};
export const useGetUserInfo=(route,token)=>{
    return useQuery({
        queryKey:["user_info"],
        queryFn:async()=>await GetService(route,token),
        enabled:!!token,
        staleTime:1000*60*60,
        cacheTime:1000*60*60
    })
};
export default useSpecificQuery;