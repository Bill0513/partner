import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MeetingRoom } from './entities/meeting-room.entity';
import { Like, Repository } from 'typeorm';
import { CreateMeetingRoomDto } from './dto/create-meeting-room.dto';
import { UpdateMeetingRoomDto } from './dto/update-meeting-room.dto';
import { MeetingRoomListVo } from './dto/meeting-room-list.vo';
import { MeetingRoomDetailVo } from './dto/meeting-room-detail.vo';

@Injectable()
export class MeetingRoomService {
  @InjectRepository(MeetingRoom)
  private meetingRoomRepository: Repository<MeetingRoom>;

  async initData() {
    const room1 = new MeetingRoom();
    room1.name = '会议室1';
    room1.capacity = 10;
    room1.equipment = '白板';
    room1.location = '一层西';

    const room2 = new MeetingRoom();
    room2.name = '会议室2';
    room2.capacity = 5;
    room2.equipment = '';
    room2.location = '二层东';

    const room3 = new MeetingRoom();
    room3.name = '会议室3';
    room3.capacity = 30;
    room3.equipment = '白班，电视';
    room3.location = '三层东';

    await this.meetingRoomRepository.save([room1, room2, room3]);
  }

  async findMeetingRoomByPageOption(
    page: number,
    size: number,
    name: string,
    capacity: number,
    equipment: string,
  ) {
    const skipCount = (page - 1) * size;

    const condition: Record<string, any> = {};

    if (name) {
      condition.name = Like(`%${name}%`);
    }

    if (capacity) {
      condition.capacity = capacity;
    }

    if (equipment) {
      condition.equipment = Like(`%${equipment}%`);
    }

    const [list, total] = await this.meetingRoomRepository.findAndCount({
      select: ['id', 'name', 'capacity', 'equipment', 'isBooked', 'location'],
      skip: skipCount,
      take: size,
      where: condition,
    });

    const vo = new MeetingRoomListVo();
    vo.list = list;
    vo.total = total;

    return vo;
  }
  async create(meetingRoomDto: CreateMeetingRoomDto) {
    const existRoom = await this.meetingRoomRepository.findOneBy({
      name: meetingRoomDto.name,
    });

    if (existRoom) {
      throw new BadRequestException('会议室名称已存在');
    }

    return await this.meetingRoomRepository.save(meetingRoomDto);
  }

  async update(meetingRoomDto: UpdateMeetingRoomDto) {
    const existRoom = await this.meetingRoomRepository.findOneBy({
      id: meetingRoomDto.id,
    });

    if (!existRoom) {
      throw new BadRequestException('会议室不存在');
    }

    existRoom.capacity = meetingRoomDto.capacity;
    existRoom.location = meetingRoomDto.location;
    existRoom.name = meetingRoomDto.name;

    if (meetingRoomDto.description) {
      existRoom.description = meetingRoomDto.description;
    }

    if (meetingRoomDto.equipment) {
      existRoom.equipment = meetingRoomDto.equipment;
    }

    await this.meetingRoomRepository.update(
      {
        id: meetingRoomDto.id,
      },
      existRoom,
    );

    return 'success';
  }

  async findById(id: number) {
    const exsitRoom = await this.meetingRoomRepository.findOneBy({
      id: id,
    });
    const vo = new MeetingRoomDetailVo();
    vo.id = exsitRoom.id;
    vo.capacity = exsitRoom.capacity;
    vo.description = exsitRoom.description;
    vo.equipment = exsitRoom.equipment;
    vo.isBooked = exsitRoom.isBooked;
    vo.location = exsitRoom.location;
    vo.name = exsitRoom.name;

    return vo;
  }

  async delete(id: number) {
    await this.meetingRoomRepository.delete({
      id,
    });

    return 'success';
  }
}
