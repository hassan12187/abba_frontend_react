import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services"

const useStudentQuery=(page,query,status,room,token)=>{
    return useQuery({
        queryKey:['student',page,query,status,room],
        queryFn:async()=>await GetService(`/api/admin/students?page=${page}&limit=10&query=${query}&status=${status}&room=${room}`,token),
        enabled:!!token,
        cacheTime: 1000 * 60 * 60,
        staleTime: 1000 * 60 * 60,   
    })
};
export default useStudentQuery;