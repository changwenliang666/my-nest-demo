import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/userDto';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }
    async createUser(createUserDto: CreateUserDto) {
        await this.prisma.user.create({
            data: createUserDto,
        });
        return {
            code: 0,
            msg: "success",
            data: createUserDto,
        }
    }
    async getUserInfo(name: string) {
        const user = await this.prisma.user.findUnique({
            select:{
                name: true,
                email: true,
            },
            where: {
              name:name,
            },
        });
        return {
            code: 0,
            msg: "success",
            data: user,
        }
    }
}
