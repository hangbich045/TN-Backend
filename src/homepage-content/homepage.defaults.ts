import { Prisma } from '@prisma/client';

export const DEFAULT_HOMEPAGE_CONTENT: Prisma.HomepageContentCreateInput = {
  heroTitle: 'LHU MEDIA STUDIO',
  heroDescription:
    'Hệ thống quản lý đặt lịch studio và mượn thiết bị quay chụp hiện đại hàng đầu. Nơi hiện thực hóa mọi ý tưởng truyền thông của giảng viên và sinh viên Lạc Hồng.',
  heroVideoUrl:
    'https://assets.mixkit.co/videos/preview/mixkit-recording-studio-soundboard-details-close-up-vibe-41719-large.mp4',
  heroPosterUrl: null,
  aboutContent:
    'LHU Media Studio cung cấp đầy đủ phòng ốc cách âm và trang thiết bị chuyên dụng phục vụ mọi sản phẩm truyền thông.',
  contactInfo: JSON.stringify({
    address: 'Số 10 Huỳnh Văn Nghệ, P. Bửu Long, TP. Biên Hòa, Đồng Nai',
    email: 'media@lhu.edu.vn',
    phone: '(+84) 251 3952 778',
    fanpage: 'https://facebook.com',
  }),
};

export const DEFAULT_HOMEPAGE_SERVICES: Prisma.HomepageServiceCreateInput[] = [
  {
    title: 'Chụp ảnh chuyên nghiệp',
    description:
      'Chụp ảnh chân dung, ảnh sản phẩm, thời trang với hệ thống đèn studio hiện đại bậc nhất.',
    icon: 'Camera',
    color: 'from-brand-accent/20 to-brand-accent/10 text-brand-accent border-brand-accent/30',
    order: 0,
    isActive: true,
  },
  {
    title: 'Quay phim & Vlog',
    description:
      'Không gian lý tưởng để quay vlog, phóng sự, talkshow với camera Sony Alpha chuyên dụng.',
    icon: 'Video',
    color: 'from-brand-primary/20 to-brand-secondary/20 text-brand-primary border-brand-primary/30',
    order: 1,
    isActive: true,
  },
  {
    title: 'Sản xuất Podcast',
    description:
      'Phòng podcast cách âm tuyệt đối cùng micro Rode chuyên nghiệp thu trọn vẹn cảm xúc.',
    icon: 'Mic',
    color: 'from-cyan-500/20 to-sky-500/20 text-cyan-400 border-sky-500/30',
    order: 2,
    isActive: true,
  },
  {
    title: 'Thu âm & Mixing',
    description:
      'Hệ thống sound card chất lượng phòng thu, tối ưu hóa giọng nói và âm thanh nhạc cụ.',
    icon: 'Music',
    color: 'from-emerald-500/20 to-teal-500/20 text-emerald-400 border-emerald-500/30',
    order: 3,
    isActive: true,
  },
];

export const DEFAULT_HOMEPAGE_GALLERY: Prisma.HomepageGalleryCreateInput[] = [
  {
    imageUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&auto=format&fit=crop&q=80',
    title: 'Góc ghi hình talkshow',
    order: 0,
    isActive: true,
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?w=800&auto=format&fit=crop&q=80',
    title: 'Khu vực chụp ảnh sản phẩm',
    order: 1,
    isActive: true,
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&auto=format&fit=crop&q=80',
    title: 'Thiết bị thu âm chuyên dụng',
    order: 2,
    isActive: true,
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&auto=format&fit=crop&q=80',
    title: 'Phòng cách âm sản xuất Podcast',
    order: 3,
    isActive: true,
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1616469829581-73993eb86b02?w=800&auto=format&fit=crop&q=80',
    title: 'Không gian làm việc sáng tạo',
    order: 4,
    isActive: true,
  },
  {
    imageUrl:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
    title: 'Thiết bị máy quay Sony cao cấp',
    order: 5,
    isActive: true,
  },
];

export const DEFAULT_HOMEPAGE_SECTION: Prisma.HomepageSectionCreateInput = {
  showHero: true,
  showServices: true,
  showGallery: true,
  showAbout: true,
  showContact: true,
};

export const HOMEPAGE_SERVICE_ICONS = [
  'Camera',
  'Video',
  'Mic',
  'Music',
  'Image',
  'Monitor',
  'Headphones',
  'Film',
] as const;

export type HomepageServiceIcon = (typeof HOMEPAGE_SERVICE_ICONS)[number];
