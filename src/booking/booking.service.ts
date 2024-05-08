import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  Between,
  EntityManager,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { MeetingRoom } from 'src/meeting-room/entities/meeting-room.entity';
import { Booking } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from './entities/booking-status';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';
import { BookingListVo } from './dto/booking-list.vo';

@Injectable()
export class BookingService {
  private logger = new Logger();

  @InjectEntityManager()
  private readonly entityManager: EntityManager;

  @Inject(RedisService)
  private redisService: RedisService;

  @Inject(EmailService)
  private emailService: EmailService;

  async find(
    page: number,
    size: number,
    username: string,
    meetingRoomName: string,
    meetingRoomPosition: string,
    bookingTimeRangeStart: number,
    bookingTimeRangeEnd: number,
  ) {
    const skipCount = (page - 1) * size;

    const condition: Record<string, any> = {};

    if (username) {
      condition.user = {
        username: Like(`%${username}%`),
      };
    }

    if (meetingRoomName) {
      condition.room = {
        name: Like(`%${meetingRoomName}%`),
      };
    }

    if (meetingRoomPosition) {
      if (!condition.room) {
        condition.room = {};
      }

      condition.room.location = Like(`%${meetingRoomPosition}%`);
    }

    if (bookingTimeRangeStart && bookingTimeRangeEnd) {
      condition.startTime = Between(
        new Date(bookingTimeRangeStart),
        new Date(bookingTimeRangeEnd),
      );
    }

    const [list, total] = await this.entityManager.findAndCount(Booking, {
      where: condition,
      relations: {
        user: true,
        room: true,
      },
      skip: skipCount,
      take: size,
    });

    const vo = new BookingListVo();

    vo.list = list.map((item) => {
      delete item.user.password;
      return item;
    });

    vo.total = total;

    return {
      list: list.map((item) => {
        delete item.user.password;
        return item;
      }),
      total,
    };
  }

  async add(createBookingDto: CreateBookingDto, userId: number) {
    const existMeetingRoom = await this.entityManager.findOneBy(MeetingRoom, {
      id: createBookingDto.meetingRoomId,
    });

    if (!existMeetingRoom) {
      throw new BadRequestException('会议室不存在');
    }

    const existBooking = await this.entityManager.findOneBy(Booking, {
      room: {
        id: existMeetingRoom.id,
      },
      startTime: LessThanOrEqual(new Date(createBookingDto.startTime)),
      endTime: MoreThanOrEqual(new Date(createBookingDto.endTime)),
    });

    if (existBooking) {
      throw new BadRequestException('该时间段已被预定');
    }

    const user = await this.entityManager.findOneBy(User, {
      id: userId,
    });

    const booking = new Booking();
    booking.room = existMeetingRoom;
    booking.user = user;
    booking.startTime = new Date(createBookingDto.startTime);
    booking.endTime = new Date(createBookingDto.endTime);
    booking.note = createBookingDto.note || '';

    try {
      await this.entityManager.transaction(
        async (transactionalEntityManager) => {
          await transactionalEntityManager.save(Booking, booking);
        },
      );
      return '预定成功';
    } catch (error) {
      this.logger.error(error, BookingService);
      return '预定失败';
    }
  }

  async apply(id: number) {
    const existBooking = await this.entityManager.findOneBy(Booking, {
      id,
    });
    if (!existBooking) {
      throw new BadRequestException('预定不存在');
    }
    if (existBooking.status !== BookingStatus.WAIT) {
      throw new BadRequestException('该预定不能操作');
    }
    await this.entityManager.update(
      Booking,
      { id },
      {
        status: BookingStatus.PASS,
      },
    );
    return 'success';
  }

  async reject(id: number) {
    const existBooking = await this.entityManager.findOneBy(Booking, {
      id,
    });
    if (!existBooking) {
      throw new BadRequestException('预定不存在');
    }
    if (existBooking.status !== BookingStatus.WAIT) {
      throw new BadRequestException('该预定不能操作');
    }
    await this.entityManager.update(
      Booking,
      { id },
      {
        status: BookingStatus.REJECT,
      },
    );
    return 'success';
  }

  async unbind(id: number) {
    const existBooking = await this.entityManager.findOneBy(Booking, {
      id,
    });
    if (!existBooking) {
      throw new BadRequestException('预定不存在');
    }
    if (existBooking.status !== BookingStatus.WAIT) {
      throw new BadRequestException('该预定不能操作');
    }
    await this.entityManager.update(
      Booking,
      { id },
      {
        status: BookingStatus.RELIEVE,
      },
    );
    return 'success';
  }

  async urge(id: number) {
    const flag = await this.redisService.get('urge_' + id);

    if (flag) {
      return '半小时只能催办一次，请耐心等待';
    }

    let email = await this.redisService.get('admin_email');

    if (!email) {
      const admin = await this.entityManager.findOne(User, {
        select: {
          email: true,
        },
        where: {
          is_admin: true,
        },
      });

      email = admin.email;

      this.redisService.set('admin_email', admin.email);
    }

    this.emailService.sendMail({
      to: email,
      subject: '预定申请催办提醒',
      html: `id 为 ${id} 的预定申请正在等待审批`,
    });

    this.redisService.set('urge_' + id, 1, 60 * 30);

    return 'success';
  }

  async initData() {
    const user1 = await this.entityManager.findOneBy(User, {
      id: 1,
    });

    const user2 = await this.entityManager.findOneBy(User, {
      id: 2,
    });

    const room1 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 3,
    });

    const room2 = await this.entityManager.findOneBy(MeetingRoom, {
      id: 6,
    });

    const booking1 = new Booking();
    booking1.room = room1;
    booking1.user = user1;
    booking1.startTime = new Date();
    booking1.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking1);

    const booking2 = new Booking();
    booking2.room = room2;
    booking2.user = user2;
    booking2.startTime = new Date();
    booking2.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking2);

    const booking3 = new Booking();
    booking3.room = room1;
    booking3.user = user2;
    booking3.startTime = new Date();
    booking3.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking3);

    const booking4 = new Booking();
    booking4.room = room2;
    booking4.user = user1;
    booking4.startTime = new Date();
    booking4.endTime = new Date(Date.now() + 1000 * 60 * 60);

    await this.entityManager.save(Booking, booking4);
  }
}
