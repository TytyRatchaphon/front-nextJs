# EnjoyBook UI Style Guide for Flutter

เอกสารนี้เป็น source of truth สำหรับทำ UI Flutter ให้มีบุคลิกใกล้กับเว็บ EnjoyBook ปัจจุบัน โดยอ้างอิงจาก Next.js/Tailwind/Ant Design UI ใน repo นี้

## 1. Brand Feel

EnjoyBook เป็นแพลตฟอร์มอ่านนิยายและซื้อคอนเทนต์ จุดเด่นของ UI คือ:

- สดใส อ่านง่าย เป็นมิตรกับผู้ใช้ไทย
- ใช้สีแดงเป็นสัญญาณหลักของแบรนด์และ action
- พื้นหลังส่วนใหญ่สว่าง สะอาด และใช้การ์ดสีขาว
- คอนเทนต์นำด้วยรูปปกนิยาย แบนเนอร์ และรูปโปรโมชัน
- Layout ต้องรองรับรายการยาว การเลื่อนแนวนอน และข้อมูลจำนวนมาก

หลีกเลี่ยงสไตล์ที่มืด หนัก หรือ minimal จนเกินไป เพราะเว็บปัจจุบันมีบุคลิกแบบ entertainment marketplace มากกว่า enterprise app

## 2. Core Tokens

### Colors

ใช้ `primaryRed` เป็นสีหลักใน Flutter เพื่อรวมสีแดงหลายเฉดของเว็บให้เป็นระบบเดียว

| Role | Hex | Flutter | Usage |
| --- | --- | --- | --- |
| Primary Red | `#DC2626` | `Color(0xFFDC2626)` | ปุ่มหลัก, active state, link hover, badge สำคัญ |
| Brand Red | `#E33527` | `Color(0xFFE33527)` | heading accent, review/action highlight |
| Action Red | `#EF304B` | `Color(0xFFEF304B)` | CTA ในหน้าที่มี visual สด เช่น book updates |
| Soft Red | `#FEE2E2` | `Color(0xFFFEE2E2)` | active background, warning/soft panels |
| Pale Pink | `#FFB9B9` | `Color(0xFFFFB9B9)` | tag background, secondary brand surface |
| White | `#FFFFFF` | `Color(0xFFFFFFFF)` | card/surface หลัก |
| App Gray BG | `#F4F6F9` | `Color(0xFFF4F6F9)` | page background ของ list/profile/review |
| Warm BG | `#FFF8F3` | `Color(0xFFFFF8F3)` | feature/editorial pages |
| Text Strong | `#111827` | `Color(0xFF111827)` | title, important text |
| Text Body | `#374151` | `Color(0xFF374151)` | body copy |
| Text Muted | `#6B7280` | `Color(0xFF6B7280)` | metadata, helper text |
| Border | `#E5E7EB` | `Color(0xFFE5E7EB)` | card border, divider |
| Success | `#16A34A` | `Color(0xFF16A34A)` | success, completed, free/available |
| Warning | `#F59E0B` | `Color(0xFFF59E0B)` | coins, rewards, caution |

Flutter ควรเลือกใช้ `#DC2626` เป็น `ColorScheme.primary` และใช้ `#E33527` หรือ `#EF304B` เฉพาะเมื่อหน้าเดิมของเว็บมี mood สดกว่า เช่น promotion, achievement, book updates

### Typography

เว็บใช้ `Bai Jamjuree` เป็น font หลัก ควรใช้ font เดียวกันใน Flutter

```dart
ThemeData(
  fontFamily: 'BaiJamjuree',
  useMaterial3: true,
)
```

แนะนำให้ bundle weights `400`, `500`, `600`, `700` ใน Flutter แม้เว็บโหลด weight `500` เป็นหลัก เพื่อให้ตัวหนาใน mobile คมและเสถียรกว่า

| Role | Size | Line Height | Weight |
| --- | ---: | ---: | ---: |
| Display / Hero | 32 | 40 | 700 |
| Page Title | 24 | 32 | 700 |
| Section Title | 20 | 28 | 700 |
| Card Title | 16 | 22 | 600 |
| Body | 14 | 22 | 500 |
| Body Small | 13 | 20 | 500 |
| Caption | 12 | 18 | 500 |
| Micro Badge | 10 | 14 | 700 |

Rules:

- ใช้ letter spacing `0`
- หลีกเลี่ยง text ที่บางกว่า weight `400`
- Thai text ต้องมี line height ค่อนข้างโปร่ง โดยเฉพาะ body และ description
- Title ของหนังสือควร clamp 2 บรรทัด, metadata clamp 1 บรรทัด

### Spacing

ใช้ scale นี้เป็นหลัก:

| Token | Value |
| --- | ---: |
| `space2` | 2 |
| `space4` | 4 |
| `space8` | 8 |
| `space12` | 12 |
| `space16` | 16 |
| `space20` | 20 |
| `space24` | 24 |
| `space32` | 32 |
| `space40` | 40 |

Mobile page padding ใช้ `16` เป็น default, dense card ใช้ `12`, section gap ใช้ `24-32`

### Radius

| Role | Radius |
| --- | ---: |
| Book cover/card image | 8 |
| Standard card | 8-12 |
| Input/select | 8-12 |
| Button | 999 หรือ 12 |
| Modal/sheet | 18-24 |
| Feature panel | 24-32 |
| Avatar | 999 |

ใช้ radius ใหญ่เฉพาะ modal, hero, feature section หรือ achievement style เท่านั้น การ์ดรายการทั่วไปไม่ควรกลมมากเกินไป

### Elevation

เว็บใช้ shadow เบาและ border อ่อนเป็นหลัก

```dart
BoxShadow(
  color: Color(0x1A0F172A),
  blurRadius: 16,
  offset: Offset(0, 6),
)
```

Guidelines:

- Card ปกติ: border `#E5E7EB` + shadow เบามาก
- Popover/sheet: shadow ชัดขึ้นเล็กน้อย
- หลีกเลี่ยง colored glow หนัก ๆ
- Hover ไม่มีใน mobile ให้แทนด้วย pressed state หรือ ripple เบา ๆ

## 3. Flutter Theme Skeleton

```dart
import 'package:flutter/material.dart';

class EjbColors {
  static const primaryRed = Color(0xFFDC2626);
  static const brandRed = Color(0xFFE33527);
  static const actionRed = Color(0xFFEF304B);
  static const softRed = Color(0xFFFEE2E2);
  static const palePink = Color(0xFFFFB9B9);
  static const pageGray = Color(0xFFF4F6F9);
  static const warmBg = Color(0xFFFFF8F3);
  static const textStrong = Color(0xFF111827);
  static const textBody = Color(0xFF374151);
  static const textMuted = Color(0xFF6B7280);
  static const border = Color(0xFFE5E7EB);
  static const success = Color(0xFF16A34A);
  static const warning = Color(0xFFF59E0B);
}

ThemeData buildEnjoyBookTheme() {
  final colorScheme = ColorScheme.fromSeed(
    seedColor: EjbColors.primaryRed,
    primary: EjbColors.primaryRed,
    surface: Colors.white,
    background: EjbColors.pageGray,
    onPrimary: Colors.white,
    onSurface: EjbColors.textStrong,
  );

  return ThemeData(
    useMaterial3: true,
    fontFamily: 'BaiJamjuree',
    colorScheme: colorScheme,
    scaffoldBackgroundColor: EjbColors.pageGray,
    textTheme: const TextTheme(
      headlineLarge: TextStyle(fontSize: 32, height: 1.25, fontWeight: FontWeight.w700),
      headlineMedium: TextStyle(fontSize: 24, height: 1.33, fontWeight: FontWeight.w700),
      titleLarge: TextStyle(fontSize: 20, height: 1.4, fontWeight: FontWeight.w700),
      titleMedium: TextStyle(fontSize: 16, height: 1.375, fontWeight: FontWeight.w600),
      bodyMedium: TextStyle(fontSize: 14, height: 1.57, fontWeight: FontWeight.w500),
      bodySmall: TextStyle(fontSize: 12, height: 1.5, fontWeight: FontWeight.w500),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: EjbColors.primaryRed,
        foregroundColor: Colors.white,
        elevation: 0,
        minimumSize: const Size(44, 44),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: EjbColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: EjbColors.primaryRed, width: 1.5),
      ),
    ),
  );
}
```

## 4. Layout Patterns

### App Shell

Flutter ควรมี shell กลางคล้ายเว็บ:

- Top app bar หรือ sticky header
- Bottom navigation หรือ drawer สำหรับ mobile
- Global auth/login modal
- Notification/cart/profile entry points
- Cookie/app banner ถ้าต้องใช้ตาม platform policy

### Page Width

บน mobile ให้เต็มจอพร้อม padding `16`

บน tablet/desktop Flutter ให้จำกัดความกว้างด้วย `ConstrainedBox` ประมาณ `1180-1200` เพื่อให้เหมือนเว็บ

```dart
Center(
  child: ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 1200),
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: child,
    ),
  ),
)
```

### Responsive

- ใช้ `LayoutBuilder` แทน fixed width
- Mobile: 1 column
- Tablet: 2 columns สำหรับ cards/forms
- Desktop: 3-4 columns หรือ max content width
- Horizontal book lists ให้ใช้ `ListView.separated(scrollDirection: Axis.horizontal)`

## 5. Component Style

### Primary Button

- Background `#DC2626`
- Text white
- Height `44-48`
- Radius `999` สำหรับ CTA หลัก
- Disabled opacity ประมาณ `0.45`

### Secondary Button

- Background white
- Border `#DC2626` หรือ `#E5E7EB`
- Text `#DC2626` หรือ `#374151`
- Pressed background `#FEE2E2`

### Book Card

เว็บใช้ card กว้างประมาณ `180` และสูงคงที่ใน carousel ดังนั้น Flutter ควรมี card ที่ predictable

- Width mobile carousel: `150-170`
- Cover aspect ratio: ประมาณ `168:237`
- Card background: white
- Radius: 8
- Shadow: เบา
- Title: 2 lines
- Writer: 1 line, muted
- Stats row: icon + small text
- Badges: new, bestseller, discount, ended

### Book Cover

- ใช้ image fallback เสมอ
- Object fit: cover
- Clip radius เฉพาะด้านบนถ้าอยู่ในการ์ด
- Overlay discount/rank อยู่บนรูป ไม่ดัน layout

### Tags / Pills

- Default background `#FFB9B9` หรือ `#FEE2E2`
- Text ดำหรือแดงเข้ม
- Radius `999`
- Font size `11-12`
- Long text ต้อง ellipsis

### Modal / Bottom Sheet

- Radius top `18-24`
- Surface white
- Header title center หรือ left ตามบริบท
- Primary action สีแดง
- Cancel action white/red border หรือ gray
- Mobile ควรใช้ bottom sheet เมื่อ content ไม่ใหญ่มาก

### Forms

- Input height `44-48`
- Border gray, focus red
- Label ใช้ `14/500`
- Error สีแดง พร้อมข้อความ ไม่ใช้สีอย่างเดียว

### Navbar / App Bar

- Height ประมาณ `56-64` บน mobile
- Background white
- Shadow หรือ border bottom เบา
- Logo ชัด
- Icon buttons ขนาด touch target อย่างน้อย `44x44`
- Badge notification/cart ใช้ red circular badge

### Carousel / Horizontal Lists

- ใช้ item width คงที่
- อย่าให้ text หรือ badge ทำให้ card สูงไม่เท่ากัน
- ใส่ padding ซ้ายขวา `16`
- ใช้ skeleton ระหว่าง loading

## 6. Page Patterns

### Home

- เริ่มด้วย banner/hero image
- ตามด้วย category strip หรือ quick actions
- Book groups เป็น horizontal carousel
- Section title มี icon หรือ accent สีแดงได้
- Background หลัก white หรือ very light gray

### Book Detail

- Header image + cover + title + author
- Purchase panel เป็น card หรือ sticky bottom action บน mobile
- Tabs/segmented controls ใช้ red active state
- Comments/reviews ใช้ card/list ที่อ่านง่าย

### Reader

- Reader page เป็นข้อยกเว้นจาก page style ปกติ
- ให้ priority กับ readability
- Support reading themes, font size, spacing, bookmark, episode navigation
- UI chrome ต้องซ่อน/แสดงได้ ไม่รบกวนเนื้อหา

### Profile / Wallet / Store

- Background `#F4F6F9`
- ใช้ white cards แยกข้อมูล
- Currency pills ใช้ไอคอนจริงจาก assets
- Reward/rank cards ใช้ red, amber, green เป็น accent ได้ แต่ต้องไม่ชนกันเยอะเกินไป

### Promotion / Achievement / Book Updates

อนุญาตให้สดกว่า page ปกติ:

- Warm background `#FFF8F3`
- Gradient อ่อนแบบ red/pink/warm
- Radius `24-32`
- Badge และ illustration มากขึ้น

แต่ยังต้องใช้ typography, red tokens, card spacing เดียวกับระบบหลัก

## 7. Assets

ใช้ asset จริงก่อนสร้าง visual ใหม่:

- Logo/settings images จาก backend หรือ `public/images`
- Default book fallback: `/images/ejb.png`
- Default avatar: `/images/default-avatar.png`
- Currency/reward icons: coin, freecoin, fast ticket, stamp, RP
- Promotion and event banners should be image-led

Flutter ควรมี asset mapping กลาง เช่น:

```dart
class EjbAssets {
  static const defaultBookCover = 'assets/images/ejb.png';
  static const defaultAvatar = 'assets/images/default-avatar.png';
  static const coin = 'assets/images/coin.png';
  static const freeCoin = 'assets/images/freecoin.png';
  static const fastTicket = 'assets/images/fast_ticket.png';
  static const stamp = 'assets/images/stamp.png';
}
```

## 8. Motion

- Duration default: `150-250ms`
- Page/content entrance: subtle fade/slide only
- Button press: opacity, ripple, or slight scale `0.98`
- Skeleton/loading ใช้ shimmer หรือ placeholder block
- เคารพ reduced motion ถ้า platform setting ปิด animation

หลีกเลี่ยง animation ใหญ่ที่ทำให้ card/list กระโดดหรืออ่านยาก

## 9. Accessibility

- Touch target อย่างน้อย `44x44`
- Contrast body text ต้องอ่านได้บน light background
- ใช้ `Semantics` กับ icon-only buttons
- รูปที่เป็นข้อมูลต้องมี semantic label
- Error state ต้องมีข้อความ ไม่ใช้สีอย่างเดียว
- Modal/sheet ต้อง focus และ dismiss ได้ชัดเจน

ตัวอย่าง:

```dart
Semantics(
  label: 'เปิดตะกร้า',
  button: true,
  child: IconButton(
    icon: const Icon(Icons.shopping_cart_outlined),
    onPressed: onOpenCart,
  ),
)
```

## 10. Implementation Rules for Flutter

Do:

- ใช้ `Theme.of(context)` สำหรับสีและ text style
- สร้าง constants กลางสำหรับ colors, spacing, radius, shadows
- ใช้ reusable widgets เช่น `EjbButton`, `EjbBookCard`, `EjbPill`, `EjbSectionHeader`
- ใช้ `LayoutBuilder` สำหรับ responsive
- ใช้ image fallback ทุกจุดที่โหลดรูปจาก network

Do not:

- hardcode สีแดงหลายเฉดในแต่ละ widget
- ใช้ font คนละตัวกับเว็บ
- ใช้ card radius ใหญ่ทุกที่
- ทำ gradient/orb decoration เป็น default ทุกหน้า
- ใช้ emoji เป็น icon UI
- ใช้ fixed width ที่ทำให้จอเล็ก overflow

## 11. Web To Flutter Mapping

| Web Pattern | Flutter Equivalent |
| --- | --- |
| Tailwind `bg-red-600` | `EjbColors.primaryRed` |
| Tailwind `rounded-full` | `BorderRadius.circular(999)` |
| Tailwind `rounded-lg` | `BorderRadius.circular(8)` |
| AntD `Modal` | `showModalBottomSheet` mobile, `Dialog` tablet/desktop |
| AntD `Select` | `DropdownMenu` หรือ custom bottom sheet picker |
| Swiper carousel | horizontal `ListView.separated` |
| Next/Image fallback | `Image.network` with `errorBuilder` |
| lucide / Ant icons | Material icons or packaged SVG icons |
| `max-w-[1200px] mx-auto` | `Center + ConstrainedBox(maxWidth: 1200)` |

## 12. UI Quality Checklist

ก่อนส่งงาน Flutter แต่ละหน้า:

- ใช้ Bai Jamjuree แล้ว
- ใช้ `#DC2626` เป็น primary หลัก
- ไม่มีสีแดงใหม่ที่ไม่อยู่ใน token
- Book card และ cover มีขนาดเสถียร
- Text ไทยไม่แน่นหรือทับกัน
- Loading, empty, error state ครบ
- ปุ่มกดได้จริงและ touch target พอ
- รูปทุกจุดมี fallback
- Mobile ไม่มี horizontal overflow
- Tablet/desktop ไม่ยืดเต็มจนอ่านยาก
- Semantics สำหรับ icon-only action ครบ
