import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ConfigService } from "src/config/config.service";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI'),
        dbName: config.get('MONGO_DB_NAME'),
      }),
    }),
  ]
})
export class DatabaseModule {}
