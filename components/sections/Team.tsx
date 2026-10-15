import { team, teamCopy } from '@/content/team';
import { Media } from '@/components/ui/Media';
import { getAsset } from '@/lib/assets';
import { EditorialLines } from './EditorialLines';
import { staticSection } from '@/lib/static-section';

export function Team() {
  const hasPortraits = team.some(member => Boolean(getAsset(member.portrait.src)));
  const section = <section id="equipo" className="team-section editorial-section" data-editorial="team"
    data-theme="cream" data-nav="light" aria-labelledby="team-heading">
    <header className="team-header"><h2 id="team-heading" className="team-headline">
      <EditorialLines lines={teamCopy.title} />
    </h2></header>
    <div className="team-stage">
      <span className="team-seam" aria-hidden="true" data-editorial-bridge />
      <div className="team-pair">{team.map((member, index) => {
        const portraitExists = Boolean(getAsset(member.portrait.src));
        const alternateExists = Boolean(portraitExists && getAsset(member.alternatePortrait.src));
        const initials = member.name.split(/\s+/).map(part => part[0]).join('');
        const confirmedFocus = member.focusConfirmed && member.focus?.length ? member.focus : null;
        return <article key={member.id} className="team-member" data-team-member={member.id}
          aria-labelledby={`${member.id}-name`} aria-describedby={`${member.id}-role`} tabIndex={0}>
          {portraitExists ? <div className="team-portrait" data-editorial-photo data-photo-real="true"
            data-reveal-side={index === 0 ? 'left' : 'right'}>
            <div className="editorial-photo-mask"><div className="team-portrait-zoom">
              <Media path={member.portrait.src} alt={member.portrait.alt || member.name}
                width={member.portrait.width} height={member.portrait.height} focal={member.portrait.focal}
                sizes="(min-width: 1024px) 34vw, (min-width: 768px) 42vw, 90vw" />
              {alternateExists && <div className="team-portrait-alternate" aria-hidden="true">
                <Media path={member.alternatePortrait.src} alt="" width={member.alternatePortrait.width}
                  height={member.alternatePortrait.height} focal={member.alternatePortrait.focal}
                  sizes="(min-width: 1024px) 34vw, 90vw" />
              </div>}
            </div></div>
            <span className="team-portrait-shade" aria-hidden="true" />
          </div> : <div className="team-identity" aria-hidden="true">
            <span className="team-identity-number">{String(index + 1).padStart(2, '0')}</span>
            <span className="team-identity-initials">{initials}</span>
            <span className="team-identity-bridge" />
          </div>}
          <div className="team-caption-mask"><div className="team-caption">
            <h3 id={`${member.id}-name`} className="team-name">{member.name}</h3>
            <p id={`${member.id}-role`} className="team-role">{member.role}</p>
            {member.bio && <p className="team-bio">{member.bio}</p>}
            {confirmedFocus && <ul className="team-focus">{confirmedFocus.map(focus => <li key={focus}>{focus}</li>)}</ul>}
          </div></div>
        </article>;
      })}</div>
    </div>
  </section>;
  return hasPortraits ? section : staticSection(section);
}
