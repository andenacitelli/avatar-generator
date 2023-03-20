// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { generateImage } from "../../business/generateImage";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  generateImage();
  res.status(200).end();
}
