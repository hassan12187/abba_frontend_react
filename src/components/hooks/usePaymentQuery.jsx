import { useQuery } from "@tanstack/react-query";
import { GetService } from "../../Services/Services";
import { useCustom } from "../../Store/Store";

export const usePaymentQuery=(page,token,q,date)=>{
    return useQuery({
        queryKey:["page",`${page}`,q,date],
        queryFn:async()=>await GetService(`/api/payment?page=${page}&limit=10&query=${q}&date=${date}`,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,     
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