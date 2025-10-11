import { useQuery } from "@tanstack/react-query"
import { GetService } from "../../Services/Services";

const useSpecificQuery=(student_id,token)=>{
    return useQuery({
        queryKey:["student_id",student_id],
        queryFn:async()=>await GetService(`/api/student/${student_id}`,token),
        enabled:!!student_id
    });
};
export default useSpecificQuery;