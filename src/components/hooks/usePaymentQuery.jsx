import { useQuery } from "@tanstack/react-query";
import { GetService } from "../../Services/Services";
import { useCustom } from "../../Store/Store";

export const usePaymentQuery=(page,token)=>{
    return useQuery({
        queryKey:["page",`${page}`],
        queryFn:async()=>await GetService(`/api/payment?page=${page}&limit=10`,token),
        enabled:!!token,
        cacheTime:60000*60,
        staleTime:60000*60        
    });
};
export const useStudentApplication=(page)=>{
    const {token}=useCustom();
    return useQuery({
        queryKey:['applications',`${page}`],
        queryFn:()=>GetService(`/api/student/application?page=${page}&limit=10`),
        enabled:!!token,
    });
};