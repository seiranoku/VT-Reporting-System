import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: 'PrismaService',
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    })
      .overrideProvider(AppService)
      .useValue({
        getRoot: () => ({
          name: 'VT Reporting System API',
          version: '0.1.0',
          docs: '/api/docs',
        }),
        getHealth: async () => ({
          status: 'ok',
          database: 'up',
          timestamp: new Date().toISOString(),
        }),
      })
      .compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return API metadata', () => {
      expect(appController.getRoot()).toEqual({
        name: 'VT Reporting System API',
        version: '0.1.0',
        docs: '/api/docs',
      });
    });
  });
});
