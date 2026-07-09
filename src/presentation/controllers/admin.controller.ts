import { Body, Controller, Get, Post, Put, Patch, Delete, Param, Query, UseGuards, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Roles } from '../decorators/roles.decorator';
import { Permissions } from '../decorators/permissions.decorator';
import { RolesGuard } from '../guards/roles.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
import {
  GetAllUsersUseCase,
  GetPendingNounusUseCase,
  CertifyNounuUseCase,
  GetStatsUseCase,
  DeleteUserUseCase,
  RestoreUserUseCase,
  GetSettingsUseCase,
  UpdateSettingsUseCase,
  GetAllTypeParametersUseCase,
  GetTypeParameterUseCase,
  CreateTypeParameterUseCase,
  UpdateTypeParameterUseCase,
  DeleteTypeParameterUseCase,
  GetAllParametersUseCase,
  GetParameterUseCase,
  CreateParameterUseCase,
  UpdateParameterUseCase,
  DeleteParameterUseCase,
  GetAllPermissionsUseCase,
  GetPermissionUseCase,
  CreatePermissionUseCase,
  UpdatePermissionUseCase,
  DeletePermissionUseCase,
  GetRolePermissionsUseCase,
  AssignPermissionToRoleUseCase,
  RemovePermissionFromRoleUseCase,
  GetAllJobsUseCase,
  GetJobUseCase,
  CreateJobUseCase,
  UpdateJobUseCase,
  DeleteJobUseCase,
  SuspendJobUseCase,
  PrioritizeJobUseCase,
  GetAllParentsUseCase,
  GetParentUseCase,
  UpdateParentUseCase,
  DeleteParentUseCase,
  RestrictParentUseCase,
  GetAllPaymentsAdminUseCase,
  GetPaymentAdminUseCase,
  VerifyAdminPaymentUseCase,
  FailAdminPaymentUseCase,
  GetAllRoomsAdminUseCase,
  GetRoomAdminUseCase,
  DeleteRoomAdminUseCase,
  SendMessageAsNounuUseCase,
  MarkRoomAsReadUseCase,
  GetAdminUnreadCountUseCase,
  UpdateProposalStatusUseCase,
  GetAllNounusUseCase,
  RestrictNounuUseCase,
  GetNounuDetailsUseCase,
  GetUserDetailUseCase,
  GetAllSubscriptionsUseCase,
  CreateSubscriptionUseCase,
  UpdateSubscriptionUseCase,
  DeleteSubscriptionUseCase,
  PayNounuUseCase,
  VerifyNounuPaymentUseCase,
  GetNounuPaymentsUseCase,
  CreateSubAdminUseCase,
  GetAllPacksUseCase,
  GetActivePacksUseCase,
  GetPackUseCase,
  CreatePackUseCase,
  UpdatePackUseCase,
  DeletePackUseCase,
} from '../../application/admin/admin.usecases';
import {
  CertifyNounuDto,
  UpdateSettingsDto,
  CreateTypeParameterDto,
  UpdateTypeParameterDto,
  CreateParameterDto,
  UpdateParameterDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  AssignPermissionDto,
  CreateJobDto,
  UpdateJobDto,
  SuspendJobDto,
  PrioritizeJobDto,
  UpdateParentDto,
  RestrictParentDto,
  RestrictNounuDto,
  PayNounuDto,
  CreateSubAdminDto,
  CreatePackDto,
  UpdatePackDto,
} from '../dtos/admin.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ChatGateway } from '../gateways/chat.gateway';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private readonly getAllUsersUseCase: GetAllUsersUseCase,
    private readonly getPendingNounusUseCase: GetPendingNounusUseCase,
    private readonly certifyNounuUseCase: CertifyNounuUseCase,
    private readonly getStatsUseCase: GetStatsUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly restoreUserUseCase: RestoreUserUseCase,
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
    private readonly getAllTypeParametersUseCase: GetAllTypeParametersUseCase,
    private readonly getTypeParameterUseCase: GetTypeParameterUseCase,
    private readonly createTypeParameterUseCase: CreateTypeParameterUseCase,
    private readonly updateTypeParameterUseCase: UpdateTypeParameterUseCase,
    private readonly deleteTypeParameterUseCase: DeleteTypeParameterUseCase,
    private readonly getAllParametersUseCase: GetAllParametersUseCase,
    private readonly getParameterUseCase: GetParameterUseCase,
    private readonly createParameterUseCase: CreateParameterUseCase,
    private readonly updateParameterUseCase: UpdateParameterUseCase,
    private readonly deleteParameterUseCase: DeleteParameterUseCase,
    private readonly getAllPermissionsUseCase: GetAllPermissionsUseCase,
    private readonly getPermissionUseCase: GetPermissionUseCase,
    private readonly createPermissionUseCase: CreatePermissionUseCase,
    private readonly updatePermissionUseCase: UpdatePermissionUseCase,
    private readonly deletePermissionUseCase: DeletePermissionUseCase,
    private readonly getRolePermissionsUseCase: GetRolePermissionsUseCase,
    private readonly assignPermissionToRoleUseCase: AssignPermissionToRoleUseCase,
    private readonly removePermissionFromRoleUseCase: RemovePermissionFromRoleUseCase,
    private readonly getAllJobsUseCase: GetAllJobsUseCase,
    private readonly getJobUseCase: GetJobUseCase,
    private readonly createJobUseCase: CreateJobUseCase,
    private readonly updateJobUseCase: UpdateJobUseCase,
    private readonly deleteJobUseCase: DeleteJobUseCase,
    private readonly suspendJobUseCase: SuspendJobUseCase,
    private readonly prioritizeJobUseCase: PrioritizeJobUseCase,
    private readonly getAllParentsUseCase: GetAllParentsUseCase,
    private readonly getParentUseCase: GetParentUseCase,
    private readonly updateParentUseCase: UpdateParentUseCase,
    private readonly deleteParentUseCase: DeleteParentUseCase,
    private readonly restrictParentUseCase: RestrictParentUseCase,
    private readonly getAllPaymentsAdminUseCase: GetAllPaymentsAdminUseCase,
    private readonly getPaymentAdminUseCase: GetPaymentAdminUseCase,
    private readonly verifyAdminPaymentUseCase: VerifyAdminPaymentUseCase,
    private readonly failAdminPaymentUseCase: FailAdminPaymentUseCase,
    private readonly getAllRoomsAdminUseCase: GetAllRoomsAdminUseCase,
    private readonly getRoomAdminUseCase: GetRoomAdminUseCase,
    private readonly deleteRoomAdminUseCase: DeleteRoomAdminUseCase,
    private readonly sendMessageAsNounuUseCase: SendMessageAsNounuUseCase,
    private readonly markRoomAsReadUseCase: MarkRoomAsReadUseCase,
    private readonly getAdminUnreadCountUseCase: GetAdminUnreadCountUseCase,
    private readonly updateProposalStatusUseCase: UpdateProposalStatusUseCase,
    private readonly getAllNounusUseCase: GetAllNounusUseCase,
    private readonly restrictNounuUseCase: RestrictNounuUseCase,
    private readonly getNounuDetailsUseCase: GetNounuDetailsUseCase,
    private readonly getUserDetailUseCase: GetUserDetailUseCase,
    private readonly getAllSubscriptionsUseCase: GetAllSubscriptionsUseCase,
    private readonly createSubscriptionUseCase: CreateSubscriptionUseCase,
    private readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase,
    private readonly deleteSubscriptionUseCase: DeleteSubscriptionUseCase,
    private readonly payNounuUseCase: PayNounuUseCase,
    private readonly verifyNounuPaymentUseCase: VerifyNounuPaymentUseCase,
    private readonly getNounuPaymentsUseCase: GetNounuPaymentsUseCase,
    private readonly createSubAdminUseCase: CreateSubAdminUseCase,
    private readonly getAllPacksUseCase: GetAllPacksUseCase,
    private readonly getActivePacksUseCase: GetActivePacksUseCase,
    private readonly getPackUseCase: GetPackUseCase,
    private readonly createPackUseCase: CreatePackUseCase,
    private readonly updatePackUseCase: UpdatePackUseCase,
    private readonly deletePackUseCase: DeletePackUseCase,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('users')
  @Permissions('admin.users.read')
  async getUsers(@Query() query: any) {
    return this.getAllUsersUseCase.execute(query.page, query.limit, query.role, query.search);
  }

  @Get('nounus')
  @Permissions('admin.nounus.read')
  async getNounus(@Query() query: any) {
    return this.getAllNounusUseCase.execute(query.page, query.limit, query.certif);
  }

  @Get('nounus/pending')
  @Permissions('admin.nounus.read')
  async getPendingNounus(@Query() query: any) {
    return this.getPendingNounusUseCase.execute(query.page, query.limit);
  }

  @Post('nounus/:id/certify')
  @Permissions('admin.nounus.certify')
  async certifyNounu(@Param('id') id: string, @Body() dto: CertifyNounuDto) {
    return this.certifyNounuUseCase.execute(id, dto.status);
  }

  @Get('stats')
  @Permissions('admin.stats.read')
  async getStats() {
    return this.getStatsUseCase.execute();
  }

  @Get('users/:id')
  @Permissions('admin.users.read')
  async getUserDetail(@Param('id') id: string) {
    return this.getUserDetailUseCase.execute(id);
  }

  @Delete('users/:id')
  @Permissions('admin.users.delete')
  async deleteUser(@Param('id') id: string) {
    return this.deleteUserUseCase.execute(id);
  }

  @Post('users/:id/restore')
  @Permissions('admin.users.restore')
  async restoreUser(@Param('id') id: string) {
    return this.restoreUserUseCase.execute(id);
  }

  @Get('settings')
  @Permissions('admin.settings.read')
  async getSettings() {
    return this.getSettingsUseCase.execute();
  }

  @Put('settings')
  @Permissions('admin.settings.write')
  async updateSettings(@Body() dto: UpdateSettingsDto) {
    return this.updateSettingsUseCase.execute(dto);
  }

  // ── Type Parameters ──
  @Get('type-parameters')
  @Permissions('admin.settings.read')
  async getTypeParameters(@Query() query: any) {
    return this.getAllTypeParametersUseCase.execute(query.page, query.limit);
  }

  @Get('type-parameters/:id')
  @Permissions('admin.settings.read')
  async getTypeParameter(@Param('id') id: string) {
    return this.getTypeParameterUseCase.execute(Number(id));
  }

  @Post('type-parameters')
  @Permissions('admin.settings.write')
  async createTypeParameter(@Body() dto: CreateTypeParameterDto) {
    return this.createTypeParameterUseCase.execute(dto);
  }

  @Put('type-parameters/:id')
  @Permissions('admin.settings.write')
  async updateTypeParameter(@Param('id') id: string, @Body() dto: UpdateTypeParameterDto) {
    return this.updateTypeParameterUseCase.execute(Number(id), dto);
  }

  @Delete('type-parameters/:id')
  @Permissions('admin.settings.write')
  async deleteTypeParameter(@Param('id') id: string) {
    return this.deleteTypeParameterUseCase.execute(Number(id));
  }

  // ── Parameters ──
  @Get('parameters')
  @Permissions('admin.settings.read')
  async getParameters(@Query() query: any) {
    return this.getAllParametersUseCase.execute(query.page, query.limit, query.typeParameterId ? Number(query.typeParameterId) : undefined);
  }

  @Get('parameters/:id')
  @Permissions('admin.settings.read')
  async getParameter(@Param('id') id: string) {
    return this.getParameterUseCase.execute(Number(id));
  }

  @Post('parameters')
  @Permissions('admin.settings.write')
  async createParameter(@Body() dto: CreateParameterDto) {
    return this.createParameterUseCase.execute(dto);
  }

  @Put('parameters/:id')
  @Permissions('admin.settings.write')
  async updateParameter(@Param('id') id: string, @Body() dto: UpdateParameterDto) {
    return this.updateParameterUseCase.execute(Number(id), dto);
  }

  @Delete('parameters/:id')
  @Permissions('admin.settings.write')
  async deleteParameter(@Param('id') id: string) {
    return this.deleteParameterUseCase.execute(Number(id));
  }

  // ── Permissions ──
  @Get('permissions')
  @Permissions('admin.settings.read')
  async getPermissions(@Query() query: any) {
    return this.getAllPermissionsUseCase.execute(query.page, query.limit);
  }

  @Get('permissions/:id')
  @Permissions('admin.settings.read')
  async getPermission(@Param('id') id: string) {
    return this.getPermissionUseCase.execute(Number(id));
  }

  @Post('permissions')
  @Permissions('admin.settings.write')
  async createPermission(@Body() dto: CreatePermissionDto) {
    return this.createPermissionUseCase.execute(dto);
  }

  @Put('permissions/:id')
  @Permissions('admin.settings.write')
  async updatePermission(@Param('id') id: string, @Body() dto: UpdatePermissionDto) {
    return this.updatePermissionUseCase.execute(Number(id), dto);
  }

  @Delete('permissions/:id')
  @Permissions('admin.settings.write')
  async deletePermission(@Param('id') id: string) {
    return this.deletePermissionUseCase.execute(Number(id));
  }

  // ── Role-Permission assignments ──
  @Get('roles/:roleId/permissions')
  @Permissions('admin.settings.read')
  async getRolePermissions(@Param('roleId') roleId: string) {
    return this.getRolePermissionsUseCase.execute(Number(roleId));
  }

  @Post('roles/:roleId/permissions')
  @Permissions('admin.settings.write')
  async assignPermissionToRole(@Param('roleId') roleId: string, @Body() dto: AssignPermissionDto) {
    return this.assignPermissionToRoleUseCase.execute(Number(roleId), dto.permissionId);
  }

  @Delete('roles/:roleId/permissions/:permissionId')
  @Permissions('admin.settings.write')
  async removePermissionFromRole(@Param('roleId') roleId: string, @Param('permissionId') permissionId: string) {
    return this.removePermissionFromRoleUseCase.execute(Number(roleId), Number(permissionId));
  }

  // ── Jobs ──
  @Get('jobs')
  @Permissions('admin.users.read')
  async getJobs(@Query() query: any) {
    return this.getAllJobsUseCase.execute(query.page, query.limit);
  }

  @Get('jobs/:id')
  @Permissions('admin.users.read')
  async getJob(@Param('id') id: string) {
    return this.getJobUseCase.execute(Number(id));
  }

  @Post('jobs')
  @Permissions('admin.settings.write')
  async createJob(@Body() dto: CreateJobDto) {
    return this.createJobUseCase.execute(dto);
  }

  @Put('jobs/:id')
  @Permissions('admin.settings.write')
  async updateJob(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.updateJobUseCase.execute(Number(id), dto);
  }

  @Delete('jobs/:id')
  @Permissions('admin.settings.write')
  async deleteJob(@Param('id') id: string) {
    return this.deleteJobUseCase.execute(Number(id));
  }

  @Post('jobs/:id/suspend')
  @Permissions('admin.settings.write')
  async suspendJob(@Param('id') id: string, @Body() dto: SuspendJobDto) {
    return this.suspendJobUseCase.execute(Number(id), dto.suspended);
  }

  @Post('jobs/:id/prioritize')
  @Permissions('admin.settings.write')
  async prioritizeJob(@Param('id') id: string, @Body() dto: PrioritizeJobDto) {
    return this.prioritizeJobUseCase.execute(Number(id), dto.priority);
  }

  // ── Parents ──
  @Get('parents')
  @Permissions('admin.users.read')
  async getParents(@Query() query: any) {
    return this.getAllParentsUseCase.execute(query.page, query.limit);
  }

  @Get('parents/:id')
  @Permissions('admin.users.read')
  async getParent(@Param('id') id: string) {
    return this.getParentUseCase.execute(id);
  }

  @Put('parents/:id')
  @Permissions('admin.settings.write')
  async updateParent(@Param('id') id: string, @Body() dto: UpdateParentDto) {
    return this.updateParentUseCase.execute(id, dto);
  }

  @Delete('parents/:id')
  @Permissions('admin.settings.write')
  async deleteParent(@Param('id') id: string) {
    return this.deleteParentUseCase.execute(id);
  }

  @Post('parents/:id/restrict')
  @Permissions('admin.settings.write')
  async restrictParent(@Param('id') id: string, @Body() dto: RestrictParentDto) {
    return this.restrictParentUseCase.execute(id, dto.restricted);
  }

  // ── Payments ──
  @Get('payments')
  @Permissions('admin.users.read')
  async getPayments(@Query() query: any) {
    return this.getAllPaymentsAdminUseCase.execute(query.page, query.limit, query.status);
  }

  @Get('payments/:id')
  @Permissions('admin.users.read')
  async getPayment(@Param('id') id: string) {
    return this.getPaymentAdminUseCase.execute(id);
  }

  @Post('payments/:id/verify')
  @Permissions('admin.settings.write')
  async verifyAdminPayment(@Param('id') id: string) {
    return this.verifyAdminPaymentUseCase.execute(id);
  }

  @Post('payments/:id/fail')
  @Permissions('admin.settings.write')
  async failAdminPayment(@Param('id') id: string) {
    return this.failAdminPaymentUseCase.execute(id);
  }

  // ── Chat rooms ──
  @Get('chats/unread-count')
  @Permissions('admin.users.read')
  async getAdminUnreadCount(@Req() req: any) {
    const count = await this.getAdminUnreadCountUseCase.execute(req.user.sub);
    return { unreadCount: count };
  }

  @Get('chats')
  @Permissions('admin.users.read')
  async getChats(@Query() query: any) {
    return this.getAllRoomsAdminUseCase.execute(query.page, query.limit);
  }

  @Get('chats/:id')
  @Permissions('admin.users.read')
  async getChat(@Param('id') id: string) {
    return this.getRoomAdminUseCase.execute(Number(id));
  }

  @Delete('chats/:id')
  @Permissions('admin.settings.write')
  async deleteChat(@Param('id') id: string) {
    return this.deleteRoomAdminUseCase.execute(Number(id));
  }

  @Post('chats/:id/messages')
  @Permissions('admin.settings.write')
  async sendMessageAsNounu(@Param('id') id: string, @Body() dto: { content: string; isProposition?: boolean; propositionExpired?: string; montant?: number; periode?: string }) {
    const result = await this.sendMessageAsNounuUseCase.execute(Number(id), dto.content, dto.isProposition, dto.propositionExpired, dto.montant, dto.periode);
    const roomId = Number(id);
    const senderId = result.message.senderId;
    this.chatGateway.notifyNewMessage(roomId, result.message, senderId, result.receiverId).catch(() => {});
    if (result.receiverId && result.notification) {
      this.chatGateway.notifyNewNotification(result.receiverId, result.notification).catch(() => {});
    }
    return result.message;
  }

  @Post('chats/:id/messages/file')
  @Permissions('admin.settings.write')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/chat',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        content: { type: 'string', description: 'Optional caption' },
      },
    },
  })
  async sendMessageAsNounuWithFile(@Param('id') id: string, @Req() req: any, @UploadedFile() file: any) {
    const attachmentUrl = `/uploads/chat/${file.filename}`;
    const attachmentName = file.originalname;
    const attachmentType = file.mimetype;
    const content = req.body?.content || '';
    const result = await this.sendMessageAsNounuUseCase.execute(Number(id), content, false, undefined, undefined, undefined, attachmentUrl, attachmentName, attachmentType);
    const roomId = Number(id);
    const senderId = result.message.senderId;
    this.chatGateway.notifyNewMessage(roomId, result.message, senderId, result.receiverId).catch(() => {});
    if (result.receiverId && result.notification) {
      this.chatGateway.notifyNewNotification(result.receiverId, result.notification).catch(() => {});
    }
    return result.message;
  }

  @Post('chats/:id/read')
  @Permissions('admin.settings.write')
  async markRoomAsRead(@Param('id') id: string, @Body() dto: { userId: string }) {
    const result = await this.markRoomAsReadUseCase.execute(Number(id), dto.userId);
    this.chatGateway.notifyCountsAfterRead(Number(id), dto.userId).catch(() => {});
    return result;
  }

  @Post('chats/:id/messages/:msgId/proposal')
  @Permissions('admin.settings.write')
  async updateProposalStatus(@Param('id') id: string, @Param('msgId') msgId: string, @Body() dto: { status: 'Accepted' | 'Refused' }) {
    return this.updateProposalStatusUseCase.execute(Number(msgId), dto.status);
  }

  // ── Subscriptions ──
  @Get('subscriptions')
  @Permissions('admin.users.read')
  async getSubscriptions(@Query() query: any) {
    return this.getAllSubscriptionsUseCase.execute(query.page, query.limit, query.status);
  }

  @Post('subscriptions')
  @Permissions('admin.settings.write')
  async createSubscription(@Body() dto: { userId: string; typeId?: number; packId?: number; durationDays?: number; status?: string }) {
    return this.createSubscriptionUseCase.execute(dto);
  }

  @Patch('subscriptions/:id')
  @Permissions('admin.settings.write')
  async updateSubscription(@Param('id') id: string, @Body() dto: { status?: string; expiresAt?: Date; typeId?: number; packId?: number }) {
    return this.updateSubscriptionUseCase.execute(id, dto);
  }

  @Delete('subscriptions/:id')
  @Permissions('admin.settings.write')
  async deleteSubscription(@Param('id') id: string) {
    return this.deleteSubscriptionUseCase.execute(id);
  }

  // ── Nounu Payments ──
  @Post('nounus/pay')
  @Permissions('admin.nounus.certify')
  async payNounu(@Body() dto: PayNounuDto) {
    return this.payNounuUseCase.execute(dto);
  }

  @Post('nounus/pay/verify')
  @Permissions('admin.nounus.certify')
  async verifyNounuPayment(@Body() body: { transactionId: string }) {
    return this.verifyNounuPaymentUseCase.execute(body.transactionId);
  }

  @Get('nounus/:id/payments')
  @Permissions('admin.nounus.read')
  async getNounuPayments(@Param('id') id: string) {
    return this.getNounuPaymentsUseCase.execute(id);
  }

  @Post('nounus/:id/restrict')
  @Permissions('admin.settings.write')
  async restrictNounu(@Param('id') id: string, @Body() dto: RestrictNounuDto) {
    return this.restrictNounuUseCase.execute(id, dto.restricted);
  }

  @Get('nounus/:id/details')
  @Permissions('admin.nounus.read')
  async getNounuDetails(@Param('id') id: string) {
    return this.getNounuDetailsUseCase.execute(id);
  }

  // ── Sub-Admin Management ──
  @Post('sub-admins')
  @Permissions('admin.settings.write')
  async createSubAdmin(@Body() dto: CreateSubAdminDto) {
    return this.createSubAdminUseCase.execute(dto);
  }

  // ── Packs ──
  @Get('packs')
  @Permissions('admin.settings.read')
  async getPacks(@Query() query: any) {
    return this.getAllPacksUseCase.execute(query.page, query.limit);
  }

  @Get('packs/active')
  @Permissions('admin.settings.read')
  async getActivePacks() {
    return this.getActivePacksUseCase.execute();
  }

  @Get('packs/:id')
  @Permissions('admin.settings.read')
  async getPack(@Param('id') id: string) {
    return this.getPackUseCase.execute(Number(id));
  }

  @Post('packs')
  @Permissions('admin.settings.write')
  async createPack(@Body() dto: CreatePackDto) {
    return this.createPackUseCase.execute(dto);
  }

  @Put('packs/:id')
  @Permissions('admin.settings.write')
  async updatePack(@Param('id') id: string, @Body() dto: UpdatePackDto) {
    return this.updatePackUseCase.execute(Number(id), dto);
  }

  @Delete('packs/:id')
  @Permissions('admin.settings.write')
  async deletePack(@Param('id') id: string) {
    return this.deletePackUseCase.execute(Number(id));
  }
}
