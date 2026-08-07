import { uploadReceiptImage } from "../lib/storage.js";
import { saveReceiptUrl } from "../lib/transaction.js";

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {

    const {
      base64,
      trxId
    } = req.body;


    if (!base64 || !trxId) {

      return res.status(400).json({
        error: "Missing data"
      });

    }



    const url =
      await uploadReceiptImage(
        base64,
        trxId
      );



    if (url) {

      await saveReceiptUrl(
        trxId,
        url
      );

    }



    return res.status(200).json({

      success: true,

      url

    });



  } catch (err) {


    console.error(
      "Receipt upload error:",
      err
    );


    return res.status(500).json({

      success:false,

      error:err.message

    });


  }

}
