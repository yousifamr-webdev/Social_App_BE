import { DeleteObjectCommand, DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, ObjectCannedACL, PutObjectCommand, S3Client, } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { ACCESS_KEY_ID, APPLICATION_NAME, BUCKET_NAME, REGION, SECRET_ACCESS_KEY, } from "../../config/config.service.js";
import { Upload } from "@aws-sdk/lib-storage";
import { StorageApproachEnum } from "../enums/multer.enums.js";
import { createReadStream } from "node:fs";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
class S3BucketService {
    _client = new S3Client({
        region: REGION,
        credentials: {
            accessKeyId: ACCESS_KEY_ID,
            secretAccessKey: SECRET_ACCESS_KEY,
        },
    });
    async createPreSignedUploadFileUrl({ originalname, contentType, path, }) {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${originalname}`,
            ContentType: contentType,
            ACL: ObjectCannedACL.private,
        });
        const url = await getSignedUrl(this._client, command, { expiresIn: 3600 });
        return { key: command.input.Key, url };
    }
    async uploadFile({ file, path, }) {
        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
            ACL: ObjectCannedACL.private,
        });
        await this._client.send(command);
        return command.input.Key;
    }
    async uploadLargeFile({ file, path, uploadApproach = StorageApproachEnum.Disk, }) {
        const command = new Upload({
            client: this._client,
            params: {
                Bucket: BUCKET_NAME,
                Key: `${APPLICATION_NAME}/${path}/${randomUUID()}_${file.originalname}`,
                Body: uploadApproach == StorageApproachEnum.Memory
                    ? file.buffer
                    : createReadStream(file.path),
                ContentType: file.mimetype,
            },
        });
        const uploadedFile = await command.done();
        return uploadedFile.Key;
    }
    async uploadFiles({ files, path, uploadApproach = StorageApproachEnum.Memory, }) {
        const keys = await Promise.all(files.map((file) => {
            return uploadApproach == StorageApproachEnum.Memory
                ? this.uploadFile({ file, path })
                : this.uploadLargeFile({
                    file,
                    path,
                    uploadApproach: StorageApproachEnum.Disk,
                });
        }));
        return keys;
    }
    async getFile(Key) {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key,
        });
        return await this._client.send(command);
    }
    async createPreSignedGetFile({ Key, filename, download, }) {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key,
            ResponseContentDisposition: download == "true" ? `attachment; filename=${filename}` : undefined,
        });
        return await getSignedUrl(this._client, command, { expiresIn: 3600 });
    }
    async deleteFile(Key) {
        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key,
        });
        return await this._client.send(command);
    }
    async deleteFiles(Keys) {
        const command = new DeleteObjectsCommand({
            Bucket: BUCKET_NAME,
            Delete: { Objects: Keys },
        });
        return await this._client.send(command);
    }
    async listFolderKeys(Prefix) {
        const command = new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: `${APPLICATION_NAME}/${Prefix}`,
        });
        return await this._client.send(command);
    }
}
export default new S3BucketService();
