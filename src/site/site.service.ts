import { BadRequestException, Injectable } from '@nestjs/common';
import { Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Site } from './entities/site.entity';
import { SiteListVo } from './dto/site-list.vo';
import { CreateSiteDto } from './dto/create-site.dto';

@Injectable()
export class SiteService {
  @InjectRepository(Site)
  private siteRepository: Repository<Site>;

  async list(title: string, userId: number) {
    const condition: Record<string, any> = {};

    if (title) {
      condition.title = Like(`%${title}%`);
    }
    if (userId) {
      condition.userId = userId;
    }

    const [list, total] = await this.siteRepository.findAndCount({
      where: condition,
    });

    const vo = new SiteListVo();
    vo.list = list;
    vo.total = total;

    return vo;
  }

  async create(createSiteDto: CreateSiteDto, userId: number) {
    const existSite = await this.siteRepository.findOneBy({
      url: createSiteDto.url,
    });

    if (existSite) {
      throw new BadRequestException('该地址已存在');
    }

    const site = new Site();
    site.title = createSiteDto.title;
    site.desc = createSiteDto.desc;
    site.url = createSiteDto.url;
    site.userId = userId;

    return await this.siteRepository.save(site);
  }
}
