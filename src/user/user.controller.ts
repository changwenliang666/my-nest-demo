import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { Body, Post, Get, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/userDto';
import { ParseIntPipe } from '@nestjs/common';

@Controller('user')
export class UserController {
    constructor(private readonly userService: UserService) {}

    @Post('create')
    createUser(@Body() createUserDto: CreateUserDto) {
        return this.userService.createUser(createUserDto);
    }

    @Get('getUserInfo')
    getUserInfo(@Query('name') name: string) {
        return this.userService.getUserInfo(name);
    }
}
