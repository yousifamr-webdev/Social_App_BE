import {
  DeleteObjectCommand,
  GetObjectCommand,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import {
  ACCESS_KEY_ID,
  APPLICATION_NAME,
  BUCKET_NAME,
  REGION,
  SECRET_ACCESS_KEY,
} from "../../config/config.service.js";
import { Upload } from "@aws-sdk/lib-storage";
import { StorageApproachEnum } from "../enums/multer.enums.js";
import { createReadStream } from "node:fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class S3BucketService {
  private _client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });

  async createPreSignedUploadFileUrl({
    file,
    path,
  }: {
    file: Express.Multer.File;
    path: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: ObjectCannedACL.private,
    });

    const url = await getSignedUrl(this._client, command, { expiresIn: 3600 });

    return { key: command.input.Key!, url };
  }

  async uploadFile({
    file,
    path,
  }: {
    file: Express.Multer.File;
    path: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: ObjectCannedACL.private,
    });

    await this._client.send(command);

    return command.input.Key!;
  }

  async uploadLargeFile({
    file,
    path,
    uploadApproach = StorageApproachEnum.Disk,
  }: {
    file: Express.Multer.File;
    path: string;
    uploadApproach?: StorageApproachEnum;
  }) {
    const command = new Upload({
      client: this._client,
      params: {
        Bucket: BUCKET_NAME,
        Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
        Body:
          uploadApproach == StorageApproachEnum.Memory
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype,
      },
    });

    const uploadedFile = await command.done();
    return uploadedFile.Key as string;
  }

  async uploadFiles({
    files,
    path,
    uploadApproach = StorageApproachEnum.Memory,
  }: {
    files: Express.Multer.File[];
    path: string;
    uploadApproach?: StorageApproachEnum;
  }) {
    const keys = await Promise.all(
      files.map((file) => {
        return uploadApproach == StorageApproachEnum.Memory
          ? this.uploadFile({ file, path })
          : this.uploadLargeFile({
              file,
              path,
              uploadApproach: StorageApproachEnum.Disk,
            });
      }),
    );

    return keys;
  }

  async getFile(Key : string) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key,
    });

    return await this._client.send(command);
  }

  async deleteFile(Key:string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME, Key
  })
    
    return await this._client.send(command)
    
}
  
}

export default new S3BucketService();
