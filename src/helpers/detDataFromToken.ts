import { NextRequest } from "next/server";
import jwt from 'jsonwebtoken'
export const getDataFromToken = (request: NextRequest)=>{
    try {
        const token = request.cookies.get("token")?.value ||"";
        const decodedToken:any = jwt.verify(token, process.env.TOKEN_SECRET!) as {
      id: string;
      role: string;
      gym?: string;
    };

        return decodedToken
    } catch (error:any) {
        console.warn("getDataFromToken failed:", error?.message || error);
    return null;
    }
}