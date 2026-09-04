"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PageHero from "../components/PageHero";
import { BrandLogo, WA_LINK, WhatsAppIcon } from "../lib/shared";
import { useAllTours } from "../lib/useAllTours";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/i18n/LanguageContext";
import { addPostComment, createPost, deletePost, listPosts, togglePostLike, updatePost, voteOnPoll } from "../lib/postsFirestore";
import { formatLocationTag, asLocalizedText, translateDuration, translateLocation } from "../lib/toursFirestore";
import { adminFetch } from "../lib/apiClient";

const asText = (value, fallback = "") => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") return value.ka || value.en || value.ru || Object.values(value).find((item) => typeof item === "string") || fallback;
  return fallback;
};

export default function PostsPage() {
  const { t, lang, isEnglish } = useLanguage();
  const [activeFilter, setActiveFilter] = useState("all");
  const [openCommentIndex, setOpenCommentIndex] = useState(null);
  const [commentInput, setCommentInput] = useState("");
  const [remotePosts, setRemotePosts] = useState([]);
  const [composerText, setComposerText] = useState("");
  const [composerMode, setComposerMode] = useState(null);
  const [feeling, setFeeling] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [composerMessage, setComposerMessage] = useState("");
  const [savingPost, setSavingPost] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [postImage, setPostImage] = useState("");
  const [uploadingPostImage, setUploadingPostImage] = useState(false);
  const [sharePost, setSharePost] = useState(null);
  const [deletePostTarget, setDeletePostTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth() ?? {};

  const formatFeelingStr = (feelingStr) => {
    if (!feelingStr) return "";
    if (lang === "en") {
      return feelingStr
        .replace("ბედნიერი", "Happy")
        .replace("აღფრთოვანებული", "Excited")
        .replace("შთაგონებული", "Inspired")
        .replace("თავგადასავლებისთვის მზად", "Ready for Adventure")
        .replace("მშვიდი", "Peaceful");
    }
    if (lang === "ru") {
      return feelingStr
        .replace("ბედნიერი", "Счастлив")
        .replace("აღფრთოვანებული", "В восторге")
        .replace("შთაგონებული", "Вдохновлен")
        .replace("თავგადასავლებისთვის მზად", "Готов к приключениям")
        .replace("მშვიდი", "Спокоен");
    }
    if (lang === "tr") {
      return feelingStr
        .replace("ბედნიერი", "Mutlu")
        .replace("აღფრთოვანებული", "Heyecanlı")
        .replace("შთაგონებული", "İlham Almış")
        .replace("თავგადასავლებისთვის მზად", "Maceraya Hazır")
        .replace("მშვიდი", "Huzurlu");
    }
    if (lang === "ar") {
      return feelingStr
        .replace("ბედნიერი", "سعيد")
        .replace("აღფრთოვანებული", "متحمس")
        .replace("შთაგონებული", "ملهم")
        .replace("თავგადასავლებისთვის მზად", "مستعد للمغامرة")
        .replace("მშვიდი", "هادئ");
    }
    return feelingStr;
  };

  const formatTourTitleStr = (title) => {
    const raw = asText(title);
    if (!raw) return "";
    if (lang === "en") {
      return raw
        .replace("კახეთის ტური", "Kakheti Tour")
        .replace("თბილისის ტური", "Tbilisi Tour")
        .replace("მცხეთის ტური", "Mtskheta Tour")
        .replace("ყაზბეგის ტური", "Kazbegi Tour")
        .replace("ბათუმის ტური", "Batumi Tour")
        .replace("სვანეთის ტური", "Svaneti Tour")
        .replace("რაჭის ტური", "Racha Tour")
        .replace("იმერეთის ტური", "Imereti Tour")
        .replace("მარტვილის ტური", "Martvili Tour")
        .replace("პრომეთეს ტური", "Prometheus Tour")
        .replace("ბორჯომის ტური", "Borjomi Tour")
        .replace("ვარძიის ტური", "Vardzia Tour")
        .replace("ტური", "Tour");
    }
    if (lang === "ru") {
      return raw
        .replace("კახეთის ტური", "Тур в Кахетию")
        .replace("თბილისის ტური", "Тур по Тбилиси")
        .replace("მცხეთის ტური", "Тур в Мцхету")
        .replace("ყაზბეგის ტური", "Тур в Казбеги")
        .replace("ბათუმის ტური", "Тур по Батуми")
        .replace("სვანეთის ტური", "Тур в Сванетию")
        .replace("რაჭის ტური", "Тур в Рачу")
        .replace("იმერეთის ტური", "Тур в Имеретию")
        .replace("მარტვილის ტური", "Тур в Мартвили")
        .replace("პრომეთეს ტური", "Тур в пещеру Прометея")
        .replace("ბორჯომის ტური", "Тур в Боржоми")
        .replace("ვარძიის ტური", "Тур в Вардзию")
        .replace("ტური", "Тур");
    }
    if (lang === "tr") {
      return raw
        .replace("კახეთის ტური", "Kaheti Turu")
        .replace("თბილისის ტური", "Tiflis Turu")
        .replace("მცხეთის ტური", "Mtsheta Turu")
        .replace("ყაზბეგის ტური", "Kazbegi Turu")
        .replace("ბათუმის ტური", "Batum Turu")
        .replace("სვანეთის ტური", "Svaneti Turu")
        .replace("რაჭის ტური", "Raça Turu")
        .replace("იმერეთის ტური", "İmereti Turu")
        .replace("მარტვილის ტური", "Martvili Turu")
        .replace("პრომეთეს ტური", "Prometheus Turu")
        .replace("ბორჯომის ტური", "Borjomi Turu")
        .replace("ვარძიის ტური", "Vardzia Turu")
        .replace("ტური", "Turu");
    }
    if (lang === "ar") {
      return raw
        .replace("კახეთის ტური", "جولة كاخيتي")
        .replace("თბილისის ტური", "جولة تبليسي")
        .replace("მცხეთის ტური", "جولة متسخيتا")
        .replace("ყაზბეგის ტური", "جولة كازبيجي")
        .replace("ბათუმის ტური", "جولة باتومي")
        .replace("სვანეთის ტური", "جولة سفانيتي")
        .replace("რაჭის ტური", "جولة راشا")
        .replace("იმერეთის ტური", "جولة إيميريتي")
        .replace("მარტვილის ტური", "جولة مارتفيلي")
        .replace("პრომეთეს ტური", "جولة كهف بروميثيوس")
        .replace("ბორჯომის ტური", "جولة برجومي")
        .replace("ვარძიის ტური", "جولة فاردزيا")
        .replace("ტური", "جولة");
    }
    return raw;
  };

  const formatDurationStr = (dur) => {
    const raw = asText(dur);
    if (lang === "en") {
      if (!raw) return "Day Tour";
      return raw
        .replace(/1 დღე /g, "1 Day ")
        .replace(/1 დღე/g, "1 Day")
        .replace(/(\d+) დღე/g, "$1 Days")
        .replace(/0 ღამე/g, "0 Nights")
        .replace(/1 ღამე/g, "1 Night")
        .replace(/(\d+) ღამე/g, "$1 Nights")
        .replace(/დღე/g, "Day")
        .replace(/ღამე/g, "Night");
    }
    if (lang === "ru") {
      if (!raw) return "Однодневный тур";
      return raw
        .replace(/1 დღე /g, "1 День ")
        .replace(/1 დღე/g, "1 День")
        .replace(/(\d+) დღე/g, "$1 дн.")
        .replace(/0 ღამე/g, "0 ночей")
        .replace(/1 ღამე/g, "1 ночь")
        .replace(/(\d+) ღამე/g, "$1 ноч.")
        .replace(/დღე/g, "дн.")
        .replace(/ღამე/g, "ноч.");
    }
    if (lang === "tr") {
      if (!raw) return "Günübirlik Tur";
      return raw
        .replace(/1 დღე /g, "1 Gün ")
        .replace(/1 დღე/g, "1 Gün")
        .replace(/(\d+) დღე/g, "$1 Gün")
        .replace(/0 ღამე/g, "0 Gece")
        .replace(/1 ღამე/g, "1 Gece")
        .replace(/(\d+) ღამე/g, "$1 Gece")
        .replace(/დღე/g, "Gün")
        .replace(/ღამე/g, "Gece");
    }
    if (lang === "ar") {
      if (!raw) return "جولة يومية";
      return raw
        .replace(/1 დღე /g, "يوم واحد ")
        .replace(/1 დღე/g, "يوم واحد")
        .replace(/(\d+) დღე/g, "$1 أيام")
        .replace(/0 ღამე/g, "0 ليالي")
        .replace(/1 ღამე/g, "ليلة واحدة")
        .replace(/(\d+) ღამე/g, "$1 ليالي")
        .replace(/დღე/g, "يوم")
        .replace(/ღამე/g, "ليلة");
    }
    if (!raw) return "1 დღე";
    return raw;
  };

  const formatDestinationStr = (destLabel, dest) => {
    const val = asText(destLabel || dest);
    if (!val || val === "undefined") {
      return lang === "en" ? "Georgia" : lang === "ru" ? "Грузия" : lang === "tr" ? "Gürcistan" : lang === "ar" ? "جورجيا" : "საქართველო";
    }
    if (lang === "en") {
      return val
        .replace("ყაზბეგი", "Kazbegi")
        .replace("თბილისი", "Tbilisi")
        .replace("ბათუმი", "Batumi")
        .replace("კახეთი", "Kakheti")
        .replace("სვანეთი", "Svaneti")
        .replace("მესტია", "Mestia")
        .replace("გუდაური", "Gudauri")
        .replace("აჭარა", "Adjara")
        .replace("მცხეთა", "Mtskheta")
        .replace("რაჭა", "Racha")
        .replace("იმერეთი", "Imereti")
        .replace("საქართველო", "Georgia");
    }
    if (lang === "ru") {
      return val
        .replace("ყაზბეგი", "Казбеги")
        .replace("თბილისი", "Тбилиси")
        .replace("ბათუმი", "Батуми")
        .replace("კახეთი", "Кахети")
        .replace("სვანეთი", "Сванети")
        .replace("მესტია", "Местиа")
        .replace("გუდაური", "Гудаури")
        .replace("აჭარა", "Аджария")
        .replace("მცხეთა", "Мцхета")
        .replace("რაჭა", "Рача")
        .replace("იმერეთი", "Имерети")
        .replace("საქართველო", "Грузия");
    }
    if (lang === "tr") {
      return val
        .replace("ყაზბეგი", "Kazbegi")
        .replace("თბილისი", "Tiflis")
        .replace("ბათუმი", "Batum")
        .replace("კახეთი", "Kaheti")
        .replace("სვანეთი", "Svaneti")
        .replace("მესტია", "Mestia")
        .replace("გუდაური", "Gudauri")
        .replace("აჭარა", "Acara")
        .replace("მცხეთა", "Mtsheta")
        .replace("რაჭა", "Raça")
        .replace("იმერეთი", "İmereti")
        .replace("საქართველო", "Gürcistan");
    }
    if (lang === "ar") {
      return val
        .replace("ყაზბეგი", "كازبيجي")
        .replace("თბილისი", "تبليسي")
        .replace("ბათუმი", "باتومي")
        .replace("კახეთი", "كاخيتي")
        .replace("სვანეთი", "سفانيتي")
        .replace("მესტია", "ميستيا")
        .replace("გუდაური", "غودوري")
        .replace("აჭარა", "أدجارا")
        .replace("მცხეთა", "متسخيتا")
        .replace("რაჭა", "راشا")
        .replace("იმერეთი", "إيميريتي")
        .replace("საქართველო", "جورجيا");
    }
    return val;
  };

  // სტატიკური ხელით დამატებული პოსტები წაშლილია.
  const postsData = remotePosts;
  const { allTours } = useAllTours();
  const [sidebarTours, setSidebarTours] = useState([]);

  useEffect(() => {
    setSidebarTours([...allTours].sort(() => Math.random() - 0.5).slice(0, 3));
  }, [allTours]);
  useEffect(() => {
    setLoading(true);
    listPosts(user?.uid)
      .then(setRemotePosts)
      .catch((error) => console.error("პოსტები ვერ ჩაიტვირთა", error))
      .finally(() => setLoading(false));
  }, [user?.uid]);

  const uploadPostImage = async (file) => {
    if (!file || !user) return;
    setUploadingPostImage(true);
    try {
      const data = new FormData();
      data.append("file", file);
      const response = await adminFetch("/api/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("postsPage.uploadPhotoError"));
      setPostImage(result.url);
    } catch (error) {
      setComposerMessage(t("postsPage.uploadPhotoError"));
    } finally {
      setUploadingPostImage(false);
    }
  };

  const submitPost = async (event) => {
    event.preventDefault();
    if (!user) {
      setComposerMessage(t("postsPage.authError"));
      return;
    }
    if (!composerText.trim() && !pollQuestion.trim()) {
      setComposerMessage(t("postsPage.contentError"));
      return;
    }
    setSavingPost(true);
    setComposerMessage("");
    try {
      if (editingPostId) {
        await updatePost(editingPostId, user, composerText, postImage);
      } else {
        await createPost({ user, text: composerText, feeling, image: postImage, poll: composerMode === "poll" ? { question: pollQuestion.trim(), options: pollOptions.map((option) => option.trim()).filter(Boolean) } : null });
      }
      const refreshedPosts = await listPosts(user.uid);
      setRemotePosts(refreshedPosts);
      setComposerText("");
      setFeeling("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setComposerMode(null);
      setEditingPostId(null);
      setPostImage("");
      setComposerMessage(t("postsPage.publishedMsg"));
    } catch (error) {
      setComposerMessage(t("postsPage.publishError"));
      console.error(error);
    } finally {
      setSavingPost(false);
    }
  };
  const filteredPosts = postsData.filter((post) => {
    if (activeFilter === "all") return true;
    return post.category === activeFilter;
  });

  const toggleLike = async (postId) => {
    if (!user) return;
    try {
      const liked = await togglePostLike(postId, user);
      setRemotePosts((prev) => prev.map((post) => post.id === postId
        ? { ...post, isLikedByUser: liked, initialLikes: Math.max(0, post.initialLikes + (liked ? 1 : -1)) }
        : post
      ));
    } catch (error) {
      console.error("Like ვერ შეინახა", error);
    }
  };

  const handlePollVote = async (postId, optionIndex) => {
    if (!user) return;
    try {
      const votedIndex = await voteOnPoll(postId, user, optionIndex);
      setRemotePosts((prev) => prev.map((post) => {
        if (post.id !== postId || !post.poll) return post;
        const { options, voteCounts, totalVotes, userVoteIndex } = post.poll;
        const newCounts = [...voteCounts];
        let newTotal = totalVotes;
        let newUserVoteIndex = userVoteIndex;

        if (userVoteIndex !== null && userVoteIndex !== undefined) {
          newCounts[userVoteIndex] = Math.max(0, newCounts[userVoteIndex] - 1);
          newTotal = Math.max(0, newTotal - 1);
        }

        if (votedIndex !== null && votedIndex !== undefined) {
          newCounts[votedIndex] += 1;
          newTotal += 1;
          newUserVoteIndex = votedIndex;
        } else {
          newUserVoteIndex = null;
        }

        return { ...post, poll: { ...post.poll, options, voteCounts: newCounts, totalVotes: newTotal, userVoteIndex: newUserVoteIndex } };
      }));
    } catch (error) {
      console.error("ხმის მიცემა ვერ მოხერხდა", error);
    }
  };

  const handleAddComment = async (postId, event) => {
    event.preventDefault();
    const text = commentInput.trim();
    if (!user || !text) return;
    try {
      const commentId = await addPostComment(postId, user, text);
      setCommentInput("");
      const newComment = {
        id: commentId || String(Date.now()),
        author: user.displayName || user.email?.split("@")[0] || "მომხმარებელი",
        avatar: user.photoURL || "",
        text,
        createdAt: "ახლახან",
      };
      setRemotePosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const currentComments = p.comments || [];
          return {
            ...p,
            comments: [...currentComments, newComment],
            initialComments: (p.initialComments || currentComments.length) + 1,
          };
        })
      );
    } catch (error) {
      console.error("კომენტარი ვერ შეინახა", error);
    }
  };
  const startEditPost = (post) => {
    setEditingPostId(post.id);
    setComposerText(post.content || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const removePost = async () => {
    if (!deletePostTarget) return;
    try {
      await deletePost(deletePostTarget.id);
      setRemotePosts((prev) => prev.filter((post) => post.id !== deletePostTarget.id));
      setDeletePostTarget(null);
    } catch (error) {
      console.error("სტატია ვერ წაიშალა", error);
    }
  };
  const shareToNetwork = async (network, post) => {
    const url = encodeURIComponent(window.location.href + "#post-" + post.id);
    const text = encodeURIComponent(post.title || post.content || "GeorgiaTrips");
    const links = {
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + url,
      whatsapp: "https://wa.me/?text=" + text + "%20" + url,
      messenger: "https://www.facebook.com/dialog/send?link=" + url + "&app_id=YOUR_APP_ID&redirect_uri=" + encodeURIComponent(window.location.href),
      telegram: "https://t.me/share/url?url=" + url + "&text=" + text,
      x: "https://twitter.com/intent/tweet?url=" + url + "&text=" + text,
    };
    if (network === "instagram" || network === "copy") {
      await navigator.clipboard?.writeText(window.location.href + "#post-" + post.id);
      setSharePost(null);
      return;
    }
    window.open(links[network], "_blank", "noopener,noreferrer,width=680,height=620");
    setSharePost(null);
  };
  return (
    <div className="posts-page-wrapper">
      <Navbar active="posts" />

      {/* HERO SECTION */}
      <PageHero
        kicker={t("postsPage.heroKicker")}
        title={t("postsPage.heroTitle")}
        subtitle={t("postsPage.heroSubtitle")}
        image="/mestia.webp"
        alt={t("postsPage.heroTitle")}
      />

      {/* MAIN SOCIAL FEED CONTAINER */}
      {user && (
        <section className="posts-my-section">
          <div className="container">
            <div className="posts-my-articles posts-my-articles-top">
              <div className="posts-my-articles-heading"><h2>{t("postsPage.myArticles")}</h2><span>{remotePosts.filter((post) => post.authorId === user.uid).length}</span></div>
              {remotePosts.filter((post) => post.authorId === user.uid).length === 0 ? <p>{t("postsPage.noArticlesYet")}</p> : (
                <div className="posts-my-articles-grid">
                  {remotePosts.filter((post) => post.authorId === user.uid).map((post) => (
                    <article key={post.id} className="posts-my-article">
                      <strong>{post.title}</strong>
                      <div><button type="button" onClick={() => startEditPost(post)}>{t("postsPage.edit")}</button><button type="button" onClick={() => setDeletePostTarget(post)}>{t("postsPage.delete")}</button></div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      <section className="section posts-feed-section">
        <div className="container posts-feed-container posts-layout">
          <aside className="posts-tours-sidebar">
            <div className="posts-sidebar-tour-list">
              {sidebarTours.map((tour) => (
                <Link key={tour.id} href={"/tours/" + tour.id} className="posts-sidebar-tour">
                  <span className="posts-sidebar-tour-image"><Image src={tour.img || "/hero.webp"} alt={asLocalizedText(tour.title, lang)} fill sizes="96px" style={{ objectFit: "cover" }} /></span>
                  <span className="posts-sidebar-tour-info">
                    <strong>{asLocalizedText(tour.title, lang)}</strong>
                    <small>{translateDuration(tour.duration, lang)} · {translateLocation(tour.destinationLabel || tour.destination || tour.location, lang)}</small>
                  </span>
                </Link>
              ))}
            </div>
          </aside><div className="posts-main-feed"><form className="posts-composer" onSubmit={submitPost}>
              <div className="posts-composer-top">
                {user?.photoURL ? <img src={user.photoURL} alt="" className="posts-composer-avatar" /> : <BrandLogo width={42} height={42} />}
                <span>{user ? (user.displayName || user.email?.split("@")[0] || t("postsPage.userDefault")) : t("postsPage.loginToWrite")}</span>
              </div>
              <textarea value={composerText} onChange={(e) => setComposerText(e.target.value)} placeholder={t("postsPage.textareaPlaceholder")} disabled={!user} />
              <div className="posts-photo-row">
                <label className="posts-photo-upload">
                  <input type="file" accept="image/*" disabled={!user || uploadingPostImage} onChange={(e) => uploadPostImage(e.target.files?.[0])} />
                  {uploadingPostImage ? t("postsPage.uploadingPhoto") : t("postsPage.addPhoto")}
                </label>
                {postImage && <div className="posts-photo-preview"><img src={postImage} alt="" /><button type="button" onClick={() => setPostImage("")}>×</button></div>}
              </div>
              {composerMode === "feeling" && (
                <div className="posts-composer-extra">
                  <label>{t("postsPage.feelingLabel")}</label>
                  <select value={feeling} onChange={(e) => setFeeling(e.target.value)}>
                    <option value="">{t("postsPage.selectFeeling")}</option>
                    <option value="😊 ბედნიერი">{t("postsPage.feelings.happy")}</option>
                    <option value="😍 აღფრთოვანებული">{t("postsPage.feelings.excited")}</option>
                    <option value="🤩 შთაგონებული">{t("postsPage.feelings.inspired")}</option>
                    <option value="😎 თავგადასავლებისთვის მზად">{t("postsPage.feelings.ready")}</option>
                    <option value="🌿 მშვიდი">{t("postsPage.feelings.peaceful")}</option>
                  </select>
                </div>
              )}
              {composerMode === "poll" && (
                <div className="posts-composer-extra">
                  <label>{t("postsPage.pollLabel")}</label>
                  <input value={pollQuestion} onChange={(e) => setPollQuestion(e.target.value)} placeholder={t("postsPage.pollQuestionPlaceholder")} />
                  {pollOptions.map((option, index) => <input key={index} value={option} onChange={(e) => setPollOptions((prev) => prev.map((item, i) => i === index ? e.target.value : item))} placeholder={(lang === "en" ? "Option " : lang === "ru" ? "Вариант " : lang === "tr" ? "Seçenek " : lang === "ar" ? "خيار " : "პასუხი ") + (index + 1)} />)}<button type="button" className="posts-add-poll-option" onClick={() => setPollOptions((prev) => [...prev, ""])}>{t("postsPage.addOption")}</button>
                </div>
              )}
              <div className="posts-composer-actions">
                <button type="button" onClick={() => setComposerMode(composerMode === "feeling" ? null : "feeling")}>{t("postsPage.feelingLabel")}</button>
                <button type="button" onClick={() => setComposerMode(composerMode === "poll" ? null : "poll")}>{t("postsPage.pollLabel")}</button>
                {user && <button type="submit" disabled={savingPost}>{savingPost ? t("postsPage.sending") : editingPostId ? t("postsPage.saveChanges") : t("postsPage.publish")}</button>}
              </div>
              {composerMessage && <p className="posts-composer-message">{composerMessage}</p>}
            </form>
            {loading ? (
              <div className="posts-loading-state">
                <div className="posts-loading-spinner" />
                <p>{t("postsPage.loadingPosts")}</p>
              </div>
            ) : postsData.length === 0 ? <div className="posts-empty-state"><h2>{t("postsPage.noPostsYet")}</h2><p>{t("postsPage.noPostsDesc")}</p></div> : postsData.map((post) => {
            const isLiked = !!post.isLikedByUser;
            const currentLikes = post.initialLikes;
            const userComments = post.comments || [];
            const isCommentsOpen = openCommentIndex === post.id;

            return (
              <article key={post.id} className="facebook-post-card">
                {/* 1. POST HEADER */}
                <div className="fb-post-header">
                  <div className="fb-author-wrap">
                    <div className="fb-avatar">
                      {post.avatar ? <img src={post.avatar} alt="" className="posts-author-avatar" /> : <BrandLogo width={40} height={40} />}
                    </div>
                    <div className="fb-author-info">
                      <div className="fb-name-row">
                        <strong className="fb-author-name">{post.author}</strong>
                        {post.verified && <span className="fb-verified-badge" title={t("postsPage.verifiedPage")}>✓</span>}
                      </div>
                      <div className="fb-meta-row">
                        <span className="fb-time">{post.timeTag}</span>
                        <span className="fb-dot">•</span>
                        <span className="fb-public-icon" title={t("postsPage.publicPost")}>🌐</span>
                        <span className="fb-dot">•</span>
                        <span className="fb-location-tag">{formatLocationTag(post.location)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. POST BODY TEXT */}
                <div className="fb-post-body">
                  <p className="fb-post-text">{post.content}</p>
                  <p className="fb-post-hashtags">{post.hashtags}</p>
                  {post.feeling && <span className="post-feeling-badge">{formatFeelingStr(post.feeling)}</span>}
                  {post.poll?.question && (
                    <div className="posts-poll-card">
                      <strong className="posts-poll-question">{post.poll.question}</strong>
                      {(post.poll.options || []).map((option, index) => {
                        const count = post.poll.voteCounts?.[index] || 0;
                        const total = post.poll.totalVotes || 0;
                        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                        const isUserVote = post.poll.userVoteIndex === index;
                        const hasVoted = post.poll.userVoteIndex !== null && post.poll.userVoteIndex !== undefined;
                        return (
                          <button
                            type="button"
                            key={index}
                            className={`posts-poll-option ${isUserVote ? "voted" : ""} ${hasVoted ? "revealed" : ""}`}
                            disabled={!user || hasVoted}
                            onClick={() => handlePollVote(post.id, index)}
                          >
                            <span className="posts-poll-option-label">{option}</span>
                            {hasVoted && (
                              <span className="posts-poll-option-result">
                                <span className="posts-poll-option-bar" style={{ width: percent + "%" }} />
                                <span className="posts-poll-option-percent">{percent}%</span>
                                <span className="posts-poll-option-count">{count} {t("postsPage.votes")}</span>
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <div className="posts-poll-footer">
                        <span>{post.poll.totalVotes || 0} {t("postsPage.votes")}</span>
                        {!user && <span>{t("postsPage.loginToVote")}</span>}
                        {user && post.poll.userVoteIndex === null && <span>{t("postsPage.chooseAnswer")}</span>}
                        {user && post.poll.userVoteIndex !== null && post.poll.userVoteIndex !== undefined && <span>{t("postsPage.yourChoiceMarked")}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. POST MEDIA SHOWCASE */}
                {post.img && (
                  <div className="fb-post-media" style={{ position: "relative", minHeight: "300px", width: "100%" }}>
                    <Image
                      src={post.img}
                      alt={post.title || "Post image"}
                      fill
                      sizes="(max-width: 768px) 100vw, 680px"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                )}

                {/* 4. REACTIONS & COUNTS BAR */}
                <div className="fb-reactions-bar">
                  <div className="fb-reactions-icons">
                    <svg className="fb-like-summary-icon" width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "#29b2b7" : "none"} stroke={isLiked ? "#29b2b7" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    <span className="fb-reactions-count">{currentLikes}</span>
                  </div>

                  <div className="fb-counts-group">
                    <span className="fb-count-item">{userComments.length} {t("postsPage.commentsCount")}</span>
                    <span className="fb-dot">•</span>
                    <span className="fb-count-item">{post.sharesCount} {t("postsPage.sharesCount")}</span>
                  </div>
                </div>

                {/* 5. ACTION BUTTONS BAR */}
                <div className="fb-action-btns">
                  <button
                    type="button"
                    className={`fb-action-btn ${isLiked ? "liked" : ""}`}
                    disabled={!user}
                    onClick={() => toggleLike(post.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? "#29b2b7" : "none"} stroke={isLiked ? "#29b2b7" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    <span>{isLiked ? t("postsPage.liked") : t("postsPage.like")}</span>

                  </button>

                  <button
                    type="button"
                    className="fb-action-btn"
                    onClick={() => setOpenCommentIndex(isCommentsOpen ? null : post.id)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span>{t("postsPage.comment")}</span>
                  </button>

                  <button
                    type="button"
                    className="fb-action-btn"
                    onClick={() => setSharePost(sharePost?.id === post.id ? null : post)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                    <span>{t("postsPage.share")}</span>
                  </button>
                </div>

                {sharePost?.id === post.id && (
                  <div className="posts-share-menu">
                    <button type="button" className="share-btn share-facebook" onClick={() => shareToNetwork("facebook", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      <span>Facebook</span>
                    </button>
                    <button type="button" className="share-btn share-whatsapp" onClick={() => shareToNetwork("whatsapp", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      <span>WhatsApp</span>
                    </button>
                    <button type="button" className="share-btn share-messenger" onClick={() => shareToNetwork("messenger", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.119 0 11.432c0 3.459 1.633 6.53 4.2 8.538V24l3.86-2.117c1.203.333 2.48.512 3.94.512 6.627 0 12-5.119 12-11.431S18.627 0 12 0zm1.208 15.405l-3.053-3.255-5.957 3.255 6.552-6.957 3.13 3.255 5.878-3.255-6.55 6.957z"/></svg>
                      <span>Messenger</span>
                    </button>
                    <button type="button" className="share-btn share-telegram" onClick={() => shareToNetwork("telegram", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                      <span>Telegram</span>
                    </button>
                    <button type="button" className="share-btn share-instagram" onClick={() => shareToNetwork("instagram", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                      <span>Instagram</span>
                    </button>
                    <button type="button" className="share-btn share-x" onClick={() => shareToNetwork("x", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                      <span>X</span>
                    </button>
                    <button type="button" className="share-btn share-copy" onClick={() => shareToNetwork("copy", post)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                      <span>{t("postsPage.copyLink")}</span>
                    </button>
                  </div>
                )}

                {/* 6. COMMENTS SECTION DROPDOWN */}
                {isCommentsOpen && (
                  <div className="fb-comments-box">
                    {user && <form onSubmit={(e) => handleAddComment(post.id, e)} className="fb-comment-form">
                      <input
                        type="text"
                        placeholder={t("postsPage.writeCommentPlaceholder")}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        className="fb-comment-input"
                      />
                      <button type="submit" className="fb-comment-submit">{t("postsPage.sendComment")}</button>
                    </form>}

                    <div className="fb-comments-list">
                      {userComments.map((comment) => (
                        <div key={comment.id} className="fb-single-comment user-comment">
                          {comment.avatar ? <img src={comment.avatar} alt="" className="post-comment-avatar" /> : <span className="post-comment-avatar-fallback">👤</span>}
                          <span><strong>{comment.author}:</strong> {comment.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>
            );            })}
          </div>
        </div>
      </section>
      {deletePostTarget && (
        <div className="posts-delete-overlay" role="dialog" aria-modal="true">
          <div className="posts-delete-modal">
            <div className="posts-delete-icon">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </div>
            <h2>{t("postsPage.deleteModalTitle")}</h2>
            <p>
              {lang === "en"
                ? `This action cannot be undone. Are you sure you want to delete "${deletePostTarget.title || deletePostTarget.content?.slice(0, 25)}"?`
                : lang === "ru"
                ? `Это действие нельзя отменить. Вы уверены, что хотите удалить "${deletePostTarget.title || deletePostTarget.content?.slice(0, 25)}"?`
                : lang === "tr"
                ? `Bu işlem geri alınamaz. "${deletePostTarget.title || deletePostTarget.content?.slice(0, 25)}" silmek istediğinizden emin misiniz?`
                : lang === "ar"
                ? `لا يمكن التراجع عن هذا الإجراء. هل أنت تأكد من رغبتك في حذف "${deletePostTarget.title || deletePostTarget.content?.slice(0, 25)}"\؟`
                : `ეს მოქმედება ვეღარ დაბრუნდება. ნამდვილად გსურთ „${deletePostTarget.title || deletePostTarget.content?.slice(0, 25)}“-ის წაშლა?`}
            </p>
            <div className="posts-delete-actions">
              <button type="button" className="posts-delete-cancel" onClick={() => setDeletePostTarget(null)}>{t("postsPage.cancel")}</button>
              <button type="button" className="posts-delete-confirm" onClick={removePost}>{t("postsPage.deleteConfirm")}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
