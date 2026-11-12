<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { untrack } from 'svelte';
	import { enhance } from '$app/forms';
	import Avatar from '$lib/components/Avatar.svelte';
	import EmptyState from '$lib/components/EmptyState.svelte';
	import PasswordField from '$lib/components/PasswordField.svelte';
	import {
		AlertTriangle,
		BookMarked,
		CheckCircle2,
		Download,
		ExternalLink,
		FileQuestion,
		GraduationCap,
		KeyRound,
		Library,
		Lightbulb,
		LoaderCircle,
		Mail,
		PenLine,
		Save,
		ShieldCheck,
		Sparkles,
		StickyNote,
		Trash2,
		UserPen
	} from '@lucide/svelte';
	import { formatDate, suggestionStatusLabel } from '$lib/utils';
	import type { SuggestionKind } from '$lib/types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const profile = $derived(data.profile);

	let fullName = $state(untrack(() => profile.full_name));
	let bio = $state(untrack(() => profile.bio ?? ''));
	let departmentId = $state(untrack(() => profile.department_id ?? ''));
	let programId = $state(untrack(() => profile.program_id ?? ''));
	let yearLevel = $state(untrack(() => (profile.year_level ? String(profile.year_level) : '')));
	let semester = $state(untrack(() => (profile.semester ? String(profile.semester) : '')));
	let avatarColor = $state(untrack(() => profile.avatar_color || data.avatarColors[0]));
	let saving = $state(false);
	let changingPassword = $state(false);
	let exportingData = $state(false);
	let deletingAccount = $state(false);

	$effect(() => {
		if (form && 'exportJson' in form && typeof form.exportJson === 'string') {
			const blob = new Blob([form.exportJson], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `pinboard-export-${new Date().toISOString().slice(0, 10)}.json`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
		}
	});

	const programs = $derived(
		data.programs.filter((program) => !departmentId || program.department_id === departmentId)
	);

	const errors = $derived(form && 'errors' in form ? (form.errors as Record<string, string>) : {});

	function onDepartmentChange() {
		if (programId && !programs.some((program) => program.id === programId)) programId = '';
	}

	const roleLabel = $derived(profile.role === 'admin' ? 'Administrator' : profile.role === 'moderator' ? 'Moderator' : 'Student');

	const statusCounts = $derived([
		{ label: 'Published', value: data.stats.verified, tone: 'badge-verified' },
		{ label: 'Needs revision', value: data.stats.rejected, tone: 'badge-rejected' }
	]);

	const suggestionKindLabel = (kind: SuggestionKind) =>
		kind === 'course'
			? 'Course'
			: kind === 'subject'
				? 'Subject'
				: kind === 'lesson'
					? 'Lesson'
					: kind === 'correction'
						? 'Correction'
						: 'Platform';
</script>

<svelte:head><title>Profile · Pinboard</title></svelte:head>

<div class="flex flex-col gap-6">
	<!-- Identity -->
	<section class="card overflow-hidden">
		<div class="relative h-28 bg-[#F3EDDD] sm:h-36">
			<div class="absolute inset-0 opacity-60" style="background-image: radial-gradient(rgba(33,29,49,0.12) 1.5px, transparent 1.5px); background-size: 18px 18px;"></div>
			<span class="pin-dot absolute left-8 top-6" style="--pin-color:#E5484D"></span>
			<span class="pin-dot absolute right-16 top-9" style="--pin-color:#5130B8"></span>
			<span class="tape left-1/3 top-3 h-5 w-24" aria-hidden="true"></span>
		</div>
		<div class="relative px-4 pb-5 pt-0 sm:px-6">
			<div class="-mt-10 flex flex-col gap-3 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
				<div class="flex items-end gap-4">
					<div class="rounded-xl border-2 border-ink bg-paper-card p-1 shadow-[3px_3px_0_#211D31]">
						<Avatar name={profile.full_name} color={profile.avatar_color} size={84} />
					</div>
					<div class="pb-1">
						<div class="flex flex-wrap items-center gap-2">
							<span class="badge !bg-marigold !text-[0.56rem]">{roleLabel}</span>
							{#if profile.department}<span class="chip chip-soft !min-h-6 !text-[0.64rem]">{profile.department.short_name}</span>{/if}
						</div>
						<h1 class="display mt-1 text-[1.65rem] leading-tight sm:text-[2.1rem]">{profile.full_name}</h1>
						<p class="text-[0.76rem] text-ink-soft">
							{profile.program ? `${profile.program.code} · ${profile.program.name}` : 'Program not set'}
							{#if profile.year_level}· Year {profile.year_level}{/if}
							{#if profile.semester}· {profile.semester === 1 ? '1st' : '2nd'} semester{/if}
						</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2 sm:pb-2">
					<a href="/collection" class="btn btn-secondary btn-sm"><Library size={14} /> My collection</a>
					<a href="/notes/new" class="btn btn-primary btn-sm"><PenLine size={14} /> Write a note</a>
				</div>
			</div>
			{#if profile.bio}
				<p class="mt-4 max-w-3xl text-[0.85rem] leading-relaxed text-ink-soft">{profile.bio}</p>
			{:else}
				<p class="mt-4 text-[0.82rem] italic text-ink-faint">No bio yet. Add one below so classmates know what you study.</p>
			{/if}
		</div>
	</section>

	{#if form && 'success' in form && form.success}
		<div class="flex items-center gap-2 rounded-xl border-2 border-[#1C7A50] bg-[#EFFBF3] px-4 py-3 text-sm font-semibold text-[#155c3c]" role="status">
			<CheckCircle2 size={17} /> {form.message}
		</div>
	{/if}
	{#if form && 'error' in form && form.error}
		<div class="rounded-xl border-2 border-[#B42318] bg-[#FFF1EF] px-4 py-3 text-sm font-semibold text-[#8f1c12]" role="alert">{form.error}</div>
	{/if}

	<!-- Stats -->
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-5">
		<div class="card p-3.5">
			<p class="kicker !text-[0.56rem]">Notes shared</p>
			<p class="stat-value mt-1 !text-2xl">{data.stats.notes}</p>
			<p class="mt-0.5 text-[0.62rem] text-ink-soft">{data.stats.verified} published</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.56rem]">Saved notes</p>
			<p class="stat-value mt-1 !text-2xl">{data.stats.saved}</p>
			<p class="mt-0.5 text-[0.62rem] text-ink-soft">{data.stats.savedTopics} topics</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.56rem]">Study material</p>
			<p class="stat-value mt-1 !text-2xl">{data.stats.generations}</p>
			<p class="mt-0.5 text-[0.62rem] text-ink-soft">AI generations</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.56rem]">Quiz attempts</p>
			<p class="stat-value mt-1 !text-2xl">{data.stats.attempts}</p>
			<p class="mt-0.5 text-[0.62rem] text-ink-soft">avg {data.stats.averagePercent}%</p>
		</div>
		<div class="card p-3.5">
			<p class="kicker !text-[0.56rem]">Best quiz</p>
			<p class="stat-value mt-1 !text-2xl">{data.stats.bestPercent}%</p>
			<p class="mt-0.5 text-[0.62rem] text-ink-soft">personal best</p>
		</div>
	</div>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
		<div class="flex min-w-0 flex-col gap-6">
			<!-- Contributions -->
			<section>
				<div class="mb-3 flex items-end justify-between gap-3">
					<div>
						<p class="kicker">Your writing</p>
						<h2 class="mt-1 font-display text-xl font-extrabold">Contributions</h2>
					</div>
					<span class="font-mono text-[0.62rem] uppercase tracking-[0.08em] text-ink-soft">{data.stats.notes} notes</span>
				</div>

				<div class="mb-3 flex flex-wrap gap-1.5">
					{#each statusCounts as status (status.label)}
						<span class="badge {status.tone} !text-[0.56rem]">{status.value} {status.label}</span>
					{/each}
				</div>

				{#if data.notes.length}
					<div class="card overflow-hidden">
						<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
							{#each data.notes as note (note.id)}
								<li>
									<a href="/notes/{note.id}" class="flex items-start gap-3 px-4 py-3 transition hover:bg-paper-deep/60">
										<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-marigold-soft">
											<StickyNote size={15} />
										</span>
										<span class="min-w-0 flex-1">
											<span class="line-clamp-1 text-[0.85rem] font-bold">{note.title}</span>
											<span class="mt-0.5 block text-[0.66rem] text-ink-soft">
												{note.subject?.code ?? 'Subject'} · {formatDate(note.created_at)}
												{#if note.views}· {note.views} views{/if}
											</span>
										</span>
										<span class="flex shrink-0 flex-col items-end gap-1">
											<span class="badge {note.status === 'verified' ? 'badge-verified' : note.status === 'rejected' ? 'badge-rejected' : 'badge-submitted'} !text-[0.52rem]">
												{note.status === 'verified' ? 'Published' : note.status === 'rejected' ? 'Needs revision' : 'Submitted'}
											</span>
											{#if note.origin === 'ai'}<span class="badge badge-ai !px-1 !py-0 !text-[0.5rem]">AI</span>{/if}
										</span>
									</a>
								</li>
							{/each}
						</ul>
					</div>
				{:else}
					<EmptyState
						title="You haven't shared a note yet"
						description="Upload a PDF, paste your reviewer, or write directly in Pinboard. A moderator will check it before it goes community-wide."
						icon={StickyNote}
					>
						<a href="/notes/new" class="btn btn-primary btn-sm"><PenLine size={14} /> Write your first note</a>
					</EmptyState>
				{/if}
			</section>

			<!-- Suggestions -->
			<section>
				<div class="mb-3 flex items-end justify-between gap-3">
					<div>
						<p class="kicker">Curriculum input</p>
						<h2 class="mt-1 font-display text-xl font-extrabold">Recent suggestions</h2>
					</div>
					<a href="/suggestions" class="link text-[0.78rem]">See all</a>
				</div>
				{#if data.suggestions.length}
					<div class="card overflow-hidden">
						<ul class="flex flex-col divide-y divide-dashed divide-ink/15">
							{#each data.suggestions as suggestion (suggestion.id)}
								<li class="flex items-start gap-3 px-4 py-3">
									<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 border-ink bg-paper"><Lightbulb size={14} /></span>
									<div class="min-w-0 flex-1">
										<div class="flex flex-wrap items-center gap-1.5">
											<span class="font-mono text-[0.55rem] uppercase tracking-[0.06em] text-ink-faint">{suggestionKindLabel(suggestion.kind)}</span>
											<span class="badge {suggestion.status === 'accepted' ? 'badge-verified' : suggestion.status === 'declined' ? 'badge-rejected' : 'badge-submitted'} !text-[0.5rem]">
												{suggestionStatusLabel(suggestion.status)}
											</span>
										</div>
										<p class="mt-0.5 line-clamp-1 text-[0.8rem] font-bold">{suggestion.title}</p>
									</div>
									<span class="shrink-0 text-[0.62rem] text-ink-faint">{formatDate(suggestion.created_at)}</span>
								</li>
							{/each}
						</ul>
					</div>
				{:else}
					<div class="card p-4 text-center">
						<p class="text-sm font-bold">No suggestions sent</p>
						<p class="mt-1 text-[0.74rem] text-ink-soft">Missing a subject or spotted a wrong course code?</p>
						<a href="/suggestions" class="btn btn-secondary btn-sm mt-2"><Lightbulb size={14} /> Make a suggestion</a>
					</div>
				{/if}
			</section>
		</div>

		<aside class="flex flex-col gap-4">
			<!-- Edit profile -->
			<form
				method="POST"
				action="?/update"
				class="card flex flex-col gap-4 p-4 sm:p-5"
				use:enhance={() => {
					saving = true;
					return async ({ update }) => {
						await update();
						saving = false;
					};
				}}
			>
				<div class="flex items-center gap-2">
					<UserPen size={17} />
					<h2 class="font-display text-lg font-extrabold">Edit profile</h2>
				</div>

				<label class="flex flex-col">
					<span class="label">Full name</span>
					<input class="input" type="text" name="full_name" maxlength="80" bind:value={fullName} required />
					{#if errors.full_name}<span class="field-error">{errors.full_name}</span>{/if}
				</label>

				<div class="grid gap-3 sm:grid-cols-2">
					<label class="flex flex-col">
						<span class="label">Department</span>
						<select class="select" name="department_id" bind:value={departmentId} onchange={onDepartmentChange}>
							<option value="">Not set</option>
							{#each data.departments as department (department.id)}
								<option value={department.id}>{department.short_name} · {department.name}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col">
						<span class="label">Program</span>
						<select class="select" name="program_id" bind:value={programId}>
							<option value="">Not set</option>
							{#each programs as program (program.id)}
								<option value={program.id}>{program.code} · {program.name}</option>
							{/each}
						</select>
						{#if errors.program_id}<span class="field-error">{errors.program_id}</span>{/if}
					</label>
					<label class="flex flex-col">
						<span class="label">Year level</span>
						<select class="select" name="year_level" bind:value={yearLevel}>
							<option value="">Not set</option>
							{#each [1, 2, 3, 4, 5, 6] as year (year)}
								<option value={String(year)}>Year {year}</option>
							{/each}
						</select>
					</label>
					<label class="flex flex-col">
						<span class="label">Semester</span>
						<select class="select" name="semester" bind:value={semester}>
							<option value="">Not set</option>
							<option value="1">1st semester</option>
							<option value="2">2nd semester</option>
						</select>
					</label>
				</div>

				<label class="flex flex-col">
					<span class="label">Bio</span>
					<textarea
						class="textarea min-h-[5.5rem]"
						name="bio"
						rows="4"
						maxlength="500"
						bind:value={bio}
						placeholder="What are you studying? What notes do you usually share?"
					></textarea>
					<span class="mt-1 self-end font-mono text-[0.58rem] text-ink-faint">{bio.length}/500</span>
					{#if errors.bio}<span class="field-error">{errors.bio}</span>{/if}
				</label>

				<fieldset>
					<legend class="label">Avatar color</legend>
					<div class="flex flex-wrap gap-2">
						{#each data.avatarColors as color (color)}
							<label class="cursor-pointer">
								<input type="radio" name="avatar_color" value={color} bind:group={avatarColor} class="peer sr-only" />
								<span
									class="flex h-8 w-8 items-center justify-center rounded-md border-2 border-ink transition peer-checked:shadow-[2px_2px_0_#211D31]"
									style="background:{color}"
									title={color}
								>
									{#if avatarColor === color}<CheckCircle2 size={14} />{/if}
								</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<button type="submit" class="btn btn-primary" disabled={saving}>
					{#if saving}<LoaderCircle size={16} class="animate-spin" /> Saving…{:else}<Save size={16} /> Save profile{/if}
				</button>
			</form>

			<!-- Account -->
			<div class="card p-4">
				<div class="flex items-center gap-2">
					<ShieldCheck size={16} />
					<h2 class="font-display text-base font-extrabold">Account</h2>
				</div>
				<dl class="mt-2 flex flex-col gap-1.5 text-[0.76rem]">
					<div class="flex items-center justify-between gap-3">
						<dt class="flex items-center gap-1.5 text-ink-soft"><Mail size={13} /> Email</dt>
						<dd class="min-w-0 truncate font-semibold">{data.user?.email ?? '—'}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="flex items-center gap-1.5 text-ink-soft"><ShieldCheck size={13} /> Role</dt>
						<dd class="font-semibold">{roleLabel}</dd>
					</div>
					<div class="flex items-center justify-between gap-3">
						<dt class="flex items-center gap-1.5 text-ink-soft"><GraduationCap size={13} /> Member since</dt>
						<dd class="font-semibold">{formatDate(profile.created_at)}</dd>
					</div>
				</dl>
				<div class="mt-3 flex flex-col gap-1.5">
					<a href="/forgot-password" class="btn btn-secondary btn-sm"><ExternalLink size={13} /> Reset password</a>
					<a href="/study/history" class="btn btn-ghost btn-sm"><Sparkles size={13} /> Study history</a>
					<a href="/collection?tab=quizzes" class="btn btn-ghost btn-sm"><FileQuestion size={13} /> Quiz history</a>
				</div>
			</div>

			<!-- Account Security & Data Management -->
			<div class="card p-4 flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<KeyRound size={16} />
					<h2 class="font-display text-base font-extrabold">Security & Data</h2>
				</div>

				<!-- Change password -->
				<details class="rounded-lg border border-ink/20 bg-paper p-3">
					<summary class="cursor-pointer text-[0.78rem] font-bold list-none flex items-center justify-between">
						<span>Change password</span>
						<span class="text-xs text-ink-faint">▼</span>
					</summary>
					{#if form && 'passwordSuccess' in form && form.passwordSuccess}
						<p class="mt-2 text-xs font-semibold text-[#155c3c]">{form.passwordMessage}</p>
					{/if}
					{#if form && 'passwordError' in form && form.passwordError}
						<p class="mt-2 text-xs font-semibold text-[#B42318]">{form.passwordError}</p>
					{/if}
					<form
						method="POST"
						action="?/changePassword"
						class="mt-3 flex flex-col gap-2"
						use:enhance={() => {
							changingPassword = true;
							return async ({ update }) => {
								await update();
								changingPassword = false;
							};
						}}
					>
						<label class="flex flex-col">
							<span class="label !text-[0.68rem]">Current password</span>
							<PasswordField name="current_password" autocomplete="current-password" placeholder="Current password" inputClass="!min-h-9 !text-xs" />
						</label>
						<label class="flex flex-col">
							<span class="label !text-[0.68rem]">New password</span>
							<PasswordField name="new_password" autocomplete="new-password" minlength={8} placeholder="At least 8 characters" inputClass="!min-h-9 !text-xs" />
						</label>
						<label class="flex flex-col">
							<span class="label !text-[0.68rem]">Confirm password</span>
							<PasswordField name="confirm_password" autocomplete="new-password" minlength={8} placeholder="Repeat new password" inputClass="!min-h-9 !text-xs" />
						</label>
						<button type="submit" class="btn btn-primary btn-sm mt-1" disabled={changingPassword}>
							{#if changingPassword}<LoaderCircle size={14} class="animate-spin" /> Updating…{:else}Update password{/if}
						</button>
					</form>
				</details>

				<!-- Export data -->
				<details class="rounded-lg border border-ink/20 bg-paper p-3">
					<summary class="cursor-pointer text-[0.78rem] font-bold list-none flex items-center justify-between">
						<span>Export my data</span>
						<span class="text-xs text-ink-faint">▼</span>
					</summary>
					<p class="mt-2 text-[0.72rem] leading-relaxed text-ink-soft">
						Download a complete JSON export of your profile, notes, bookmarks, quiz attempts, and suggestions.
					</p>
					{#if form && 'exportSuccess' in form && form.exportSuccess}
						<p class="mt-2 text-xs font-semibold text-[#155c3c]">Export generated! Check your downloads.</p>
					{/if}
					<form
						method="POST"
						action="?/exportData"
						class="mt-2"
						use:enhance={() => {
							exportingData = true;
							return async ({ update }) => {
								await update();
								exportingData = false;
							};
						}}
					>
						<button type="submit" class="btn btn-secondary btn-sm w-full" disabled={exportingData}>
							{#if exportingData}<LoaderCircle size={14} class="animate-spin" /> Preparing export…{:else}<Download size={14} /> Download data (.json){/if}
						</button>
					</form>
				</details>

				<!-- Danger zone: Delete account -->
				<details class="rounded-lg border-2 border-[#B42318]/40 bg-[#FFF1EF]/50 p-3">
					<summary class="cursor-pointer text-[0.78rem] font-bold text-[#8f1c12] list-none flex items-center justify-between">
						<span class="flex items-center gap-1.5"><AlertTriangle size={14} /> Delete account</span>
						<span class="text-xs text-ink-faint">▼</span>
					</summary>
					<p class="mt-2 text-[0.7rem] leading-relaxed text-[#6f1a12]">
						Permanently delete your profile, auth credentials, and personal data. This action cannot be undone.
					</p>
					{#if !data.deleteConfigured}
						<p class="mt-2 rounded-lg border border-[#B42318]/40 bg-white p-2 text-[0.7rem] leading-relaxed text-[#6f1a12]">
							Deletion is disabled because the server does not have account-deletion credentials configured. Contact an administrator instead.
						</p>
					{/if}
					{#if form && 'deleteError' in form && form.deleteError}
						<p class="mt-2 text-xs font-semibold text-[#B42318]">{form.deleteError}</p>
					{/if}
					<form
						method="POST"
						action="?/deleteAccount"
						class="mt-2 flex flex-col gap-2"
						use:enhance={() => {
							deletingAccount = true;
							return async ({ update }) => {
								await update();
								deletingAccount = false;
							};
						}}
					>
						<label class="flex flex-col">
							<span class="label !text-[0.66rem] text-[#8f1c12]">Type DELETE to confirm:</span>
							<input class="input !min-h-9 !text-xs !border-[#B42318]" type="text" name="confirmation" required placeholder="DELETE" />
						</label>
						<button type="submit" class="btn btn-danger btn-sm w-full" disabled={deletingAccount || !data.deleteConfigured}>
							{#if deletingAccount}<LoaderCircle size={14} class="animate-spin" /> Deleting…{:else}<Trash2 size={14} /> Delete account permanently{/if}
						</button>
					</form>
				</details>
			</div>

			<div class="rounded-xl border-2 border-ink bg-[#F3EDDD] p-4">
				<p class="flex items-center gap-1.5 text-[0.8rem] font-bold"><BookMarked size={15} /> Labels matter</p>
				<p class="mt-1 text-[0.7rem] leading-relaxed text-ink-soft">
					Notes are labeled <strong>Published</strong> or <strong>Needs revision</strong>, and AI-assisted material is marked
					<strong>AI Generated</strong>. None of these labels mean the material is official university curriculum.
				</p>
			</div>
		</aside>
	</div>
</div>
