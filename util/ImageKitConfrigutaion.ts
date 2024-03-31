import ImageKit from "imagekit";


export const ImageIoConfig=async()=>{
  try{


    if(!process.env.IMAGE_URL_END_POINT||!process.env.IMAGE_PUBLIC_KEY||!process.env.IMAGE_PRIVATE_KEY){
        throw new Error("Required Variable of image io is not avlaible")
    }

    const Imagecongif=new ImageKit({
        urlEndpoint:process.env.IMAGE_URL_END_POINT,
        publicKey:process.env.IMAGE_PUBLIC_KEY,
        privateKey:process.env.IMAGE_PRIVATE_KEY
    })

    return Imagecongif
  }
  catch(err){
    return err+'THIS ERROR WHILE CONFIGURE IMAGEIO'
  }
}
