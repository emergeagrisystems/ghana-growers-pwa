import { FarmerPreviewFrame } from '@/components/farmer-preview/FarmerPreviewFrame';
export default function NotFound(){
 if(process.env.VERCEL_ENV==='production')return null;
 return <FarmerPreviewFrame><section><h1>Profile not found</h1><p>This Preview profile could not be found.</p><a href="/dev-preview/farmers">Back to farmers</a></section></FarmerPreviewFrame>;
}